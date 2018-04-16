import threading
import socket
import Queue
import time
import sys
import os
import spidev
import ws2812
import math

server_address = '/tmp/color.sock'
q = Queue.Queue()
spi = spidev.SpiDev()
spi.open(1,0)
color = [255,255,255]
run = True
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
    spinner.insert(0,[0,0,0])
    frame += 1
    writeframe(spinner)
    return 0.5;

def animation_bispinner():
    #First, define the spinner
    global frame

    spinner = [
                color,
                [(x-(255/5)*2) if (x-(255/5)*2)>0 else 0 for x in color],
                [(x-(255/5)*4) if (x-(255/5)*4)>0 else 0 for x in color],
                color,
                [(x-(255/5)*2) if (x-(255/5)*2)>0 else 0 for x in color],
                [(x-(255/5)*4) if (x-(255/5)*4)>0 else 0 for x in color]
            ];
    #rotate by frames
    spinner = shift(spinner, frame)
    spinner.insert(0,[0,0,0])
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

def light_perception_function(x):
    return int(256**(x/256.0))

def writeframe(frame):
    print frame
    ws2812.write2812(spi, [map(light_perception_function, x) for x in frame])

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
        global animation, run
        while True:
            try:
                if(q.empty() and run):
                    #Step the animation
                    time.sleep(animation())
                else:
                    item = q.get()
                    args = item.strip().split(" ")
                    if(args[0]=="animation"):
                        #set the new animation state
                        if(args[1]=="pulse"): 
                            animation = animation_pulse
                        elif(args[1]=="spinner"): 
                            animation = animation_spinner
                        elif(args[1]=="bispinner"): 
                            animation = animation_bispinner
                    elif(args[0]=="color"):
                        color[0] = int(args[1])
                        color[1] = int(args[2])
                        color[2] = int(args[3])
                    elif(args[0]=="on"): #Turn on the light without animation until next command
                        run = False
                        writeframe([color, color, color, color, color, color, color]);
                    elif(args[0]=="off"): #Turn off lights until next command
                        run = False
                        writeframe([[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]])
                    elif(args[0]=="pause"): #Pause current animation until next command
                        run = False
                    elif(args[0]=="resume"): #Resume without changing state (or noop)
                        run = True
                    q.task_done()
            except:
                #say something went wrong
                pass 

animation = animation_spinner
ServerSocket().start()
ColorController().start()
