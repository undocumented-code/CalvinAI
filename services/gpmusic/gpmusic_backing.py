from gmusicapi import Mobileclient
import threading
import socket
import Queue
import time
import sys
import vlc
import os

server_address = '/tmp/gpmusic.sock'
api = Mobileclient()
logged_in = api.login(sys.argv[1], sys.argv[2], Mobileclient.FROM_MAC_ADDRESS)
p = vlc.MediaPlayer()
q = Queue.Queue()

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
            print >>sys.stderr, 'gpmusic backing loaded'
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

class MusicPlayer(threading.Thread):
    def run(self):
        mq = Queue.Queue()
        is_paused = False
        stationid = None
        if not logged_in:
            print "There was an error logging in to google play music"
            sys.exit(0)
        while True:
            try:
                if(q.empty()):
                    if not p.is_playing() and not mq.empty() and not is_paused:
                        url = api.get_stream_url(mq.get())
                        #print url
                        p.set_mrl(url)
                        p.play()
                        time.sleep(1)
                        continue
                else:
                    item = q.get().strip().split(" ",2);
                    #print item;
                    if item[0] == "stop":
                        mq.queue.clear()
                        p.stop()
                        if stationid != None:
                            api.delete_stations(stationid)
                            stationid = None
                    elif item[0] == "pause":
                        p.set_pause(True)
                        is_paused = True
                    elif item[0] == "resume":
                        p.set_pause(False)
                        is_paused = False
                        time.sleep(1)
                    elif item[0] == "next":
                        p.set_pause(True)
                        is_paused = False
                    else:
                        mq.queue.clear()
                        p.stop()
                        results = api.search(item[2])
                        if item[1] == "artist":
                            if not len(results["album_hits"]):
                                #print "no album found"
                                print "I couldn't find the artist you wanted to play"
                            else:
                                artistid = results["artist_hits"][0]["artist"]["artistId"]
                                stationid = api.create_station("Calvin's Station",None,artistid);
                                tracks = api.get_station_tracks(stationid,100);
                                for track in tracks:
                                    mq.put(track["storeId"])
                        
                        elif item[1] == "album":
                            if not len(results["album_hits"]):
                                #print "no song found"
                                print "I couldn't find the album you wanted to play"
                            else:
                                tracks = api.get_album_info(results["album_hits"][0]["album"]["albumId"])
                                #print tracks
                                for track in tracks["tracks"]:
                                    mq.put(track["storeId"])

                        elif item[1] == "genre":
                            #print results["station_hits"][0]
                            if not len(results["station_hits"]):
                                #print "no album found"
                                print "I couldn't find the genre you wanted to play"
                            else:
                                genreid = results["station_hits"][0]["seed"]["genreId"]
                                stationid = api.create_station("Calvin's Station",None,None,None,genreid);
                                tracks = api.get_station_tracks(stationid,100);
                                for track in tracks:
                                    mq.put(track["storeId"])
                        
                        else:
                            if not len(results["song_hits"]):
                                #print "no song found"
                                print "I couldn't find the song you wanted to play"
                            else: 
                                #print results["song_hits"][0]["track"]
                                url = api.get_stream_url(results["song_hits"][0]["track"]["storeId"])
                                #print url
                                p.set_mrl(url)
                                p.play()
                    q.task_done()
            except:
                #say something went wrong
                pass

ServerSocket().start()
MusicPlayer().start()