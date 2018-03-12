import threading
import socket
import Queue
import time
import sys
import os
import spidev
import ws2812
import math

current_milli_time = lambda: int(round(time.time() * 1000))

server_address = '/tmp/color.sock'
q = Queue.Queue()
# spi = spidev.SpiDev()
# spi.open(0,0)
color = [255,255,255]
frame = 0

def animation_spinner():
    #First, define the spinner
    global frame

    spinner = [
                color,
                [(x-(255/5)*1) if (x-(255/5)*1)>0 else 0 for x in color],
                [(x-(255/5)*2) if (x-(255/5)*2)>0 else 0 for x in color],
                [(x-(255/5)*3) if (x-(255/5)*3)>0 else 0 for x in color],
                [(x-(255/5)*4) if (x-(255/5)*4)>0 else 0 for x in color],
                [(x-(255/5)*5) if (x-(255/5)*5)>0 else 0 for x in color]
            ];
    #rotate by frames
    spinner = shift(spinner, frame)
    spinner.append([0,0,0])
    frame += 1
    writeframe(spinner)
    return 1;


def animation_pulse():
    global frame

    spinner = [
                [math.fabs(x * math.sin(frame/100.0)) for x in color],
                [math.fabs(x * math.sin(frame/100.0)) for x in color],
                [math.fabs(x * math.sin(frame/100.0)) for x in color],
                [math.fabs(x * math.sin(frame/100.0)) for x in color],
                [math.fabs(x * math.sin(frame/100.0)) for x in color],
                [math.fabs(x * math.sin(frame/100.0)) for x in color],
                [math.fabs(x * math.sin(frame/100.0)) for x in color]
            ];
    frame += 1
    writeframe(spinner)
    return 0.01;

def shift(seq, n):
    n = n % len(seq)
    return seq[n:] + seq[:n]

def writeframe(frame):
    print frame

class ServerSocket(threading.Thread):
    def run(self):
        try:
            os.unlink(server_address)
        except OSError:
            if os.path.exists(server_address):
                raise

        sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        print >>sys.stderr, 'starting up on %s' % server_address
        sock.bind(server_address)
        sock.listen(1)

        while True:
            print >>sys.stderr, 'color backing loaded'
            connection, client_address = sock.accept()
            try:
                while True:
                    data = connection.recv(1024)
                    if data:
                        q.put(data);
                    else:
                        break
                    
            finally:
                connection.close()

class ColorController(threading.Thread):
    def run(self):
        while True:
            try:
                if(q.empty()):
                    #Step the animation
                    time.sleep(animation())
                else:
                    item = q.get();

                    #set the new animation state
                    q.task_done()
            except:
                #say something went wrong
                pass 

animation = animation_pulse
ServerSocket().start()
ColorController().start()