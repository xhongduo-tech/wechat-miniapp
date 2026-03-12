import requests
import json
import time
import os
import subprocess
import sys

# ================= 配置区域 =================
APP_ID = 'wxae185354ed8fee0a'
APP_SECRET = '1e08031c1228b4cc26a047361485dd69'
ENV_ID = 'cloud1-1gdza2vw9df0391f'  # 你的环境ID
COLLECTION_NAME = 'print_queue'
SAVE_DIR = './downloaded_images'  # 图片保存的本地文件夹
PRINTER_NAME = 'Canon_SELPHY_CP1500'  # 使用前需 lpstat -p 确认
# ===========================================

# 确保下载目录存在
if not os.path.exists(SAVE_DIR):
    os.makedirs(SAVE_DIR)


class WeChatCloudBot:
    def __init__(self):
        self.access_token = None
        self.token_expires_at = 0

    def get_token(self):
        """获取或刷新 Access Token"""
        if self.access_token and time.time() < self.token_expires_at:
            return self.access_token

        url = f'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid={APP_ID}&secret={APP_SECRET}'
        resp = requests.get(url).json()

        if 'access_token' in resp:
            self.access_token = resp['access_token']
            # 提前 200 秒刷新，防止过期
            self.token_expires_at = time.time() + resp['expires_in'] - 200
            print(f"[系统] Token 已刷新")
            return self.access_token
        else:
            raise Exception(f"Token 获取失败: {resp}")

    def fetch_pending_task(self):
        """
        1. 查询数据库：找一条 status 为 'waiting' 的记录
        """
        token = self.get_token()
        url = f'https://api.weixin.qq.com/tcb/databasequery?access_token={token}'

        # 查询语法：找 status == "waiting" 的记录，只取 1 条（排队处理）
        query_str = f'db.collection("{COLLECTION_NAME}").where({{status:"waiting"}}).limit(1).get()'

        payload = {"env": ENV_ID, "query": query_str}
        resp = requests.post(url, json=payload).json()

        if resp.get('errcode') == 0 and len(resp.get('data', [])) > 0:
            return json.loads(resp['data'][0])  # 返回找到的那条记录（字典格式）
        return None

    def get_download_url(self, file_id):
        """
        2. 换取下载链接
        """
        token = self.get_token()
        url = f'https://api.weixin.qq.com/tcb/batchdownloadfile?access_token={token}'
        payload = {
            "env": ENV_ID,
            "file_list": [{"fileid": file_id, "max_age": 3600}]
        }
        resp = requests.post(url, json=payload).json()

        # 提取下载链接
        if resp.get('file_list') and resp['file_list'][0]['status'] == 0:
            return resp['file_list'][0]['download_url']
        return None

    def mark_task_done(self, doc_id):
        """
        3. 标记完成：将数据库中该记录的 status 改为 'done'
        """
        token = self.get_token()
        url = f'https://api.weixin.qq.com/tcb/databaseupdate?access_token={token}'

        # 更新语法：根据 _id 找到记录，把 status 改为 done
        query_str = f'db.collection("{COLLECTION_NAME}").doc("{doc_id}").update({{data:{{status:"success"}}}})'

        payload = {"env": ENV_ID, "query": query_str}
        requests.post(url, json=payload)
        print(f"[数据库] 记录 {doc_id} 状态已更新为 done")

    def download_image(self, url, file_name):
        """下载文件到本地"""
        try:
            resp = requests.get(url, stream=True)
            file_path = os.path.join(SAVE_DIR, file_name)
            with open(file_path, 'wb') as f:
                for chunk in resp.iter_content(chunk_size=1024):
                    f.write(chunk)
            print(f"[下载] 成功保存: {file_path}")
            return True
        except Exception as e:
            print(f"[错误] 下载失败: {e}")
            return False

    def print_photo_mac(self, file_path):
        """mac 专用打印机函数"""
        if not os.path.exists(file_path):
            return False

        # 绝对路径，防止路径错误
        abs_path = os.path.abspath(file_path)

        # 构建命令：适应页面 + 媒体类型（可选）
        cmd = ['lp', '-d', PRINTER_NAME, '-o', 'fit-to-page', abs_path]

        try:
            print(f" >>> [硬件] 发送至打印机： {os.path.basename(file_path)}")
            # timeout=30 防止 lp 命令卡死
            subprocess.run(cmd, check=True, timeout=30)
            return True
        except subprocess.TimeoutExpired:
            print(" [错误] 打印命令超时！请检查打印机连接。")
            return False
        except subprocess.CalledProcessError as e:
            print(f" [错误] 打印系统出错：{e}")
            return False

    def run(self):
        print(">>> 打印队列监听程序已启动 (按 Ctrl+C 停止)...")
        print(f">>> 监控环境：MacOS... 目标打印机：{PRINTER_NAME}")
        while True:
            try:
                # 1. 寻找新任务
                task = self.fetch_pending_task()

                if task:
                    print(f"\n[发现任务] ID: {task['_id']}, 文件: {task.get('fileId')}")

                    file_id = task.get('fileId')
                    # 简单从 fileId 提取文件名，例如 cloud://.../abc.png -> abc.png
                    # 你也可以使用数据库里的其他字段作为文件名
                    file_name = file_id.split('/')[-1] if file_id else f"unknown_{int(time.time())}.png"

                    # 2. 获取下载链接
                    download_url = self.get_download_url(file_id)

                    if download_url:
                        # 3. 下载文件
                        if self.download_image(download_url, file_name):
                            local_path = os.path.join(SAVE_DIR, file_name)

                            # 4. 开始打印文件，打印后更新数据库状态
                            if self.print_photo_mac(local_path):
                                self.mark_task_done(task['_id'])
                                print(f" [成功] 任务完成，等待下一张...")
                                # 物理打印机需要缓冲时间，建议休眠时间稍长
                                time.sleep(10)
                            else:
                                print(f" [警告] 打印失败，保留任务状态为 waiting，请稍后重试")
                        else:
                            print(" [警告] 下载失败")

                    # 无论成功与否，短暂停顿防止 CPU 满载
                    time.sleep(2)

                else:
                    # 5. 闲时心跳
                    sys.stdout.write('.')
                    sys.stdout.flush()
                    time.sleep(10)

            except KeyboardInterrupt:
                print("\n 程序已停止")
                break
            except Exception as e:
                print(f"\n[全局异常] {e}")
                time.sleep(10)


# ================= 启动 =================
if __name__ == '__main__':
    bot = WeChatCloudBot()
    bot.run()