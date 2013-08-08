# RECENT CHANGES HERE

# -*- coding: utf-8 -*-
"""
jQuery Example
~~~~~~~~~~~~~~

A simple application that shows how Flask and jQuery get along.

:copyright: (c) 2010 by Armin Ronacher.
:license: BSD, see LICENSE for more details.
"""

# INIT

from __future__ import division
from flask import Flask, jsonify, render_template, request, redirect, url_for, session
import urllib, json, score_calculation, fetch_fb_functions, datetime
from threading import Thread
from Queue import Queue
import time

RECALCULATE_AFTER = 2628000 # Average Time Equivalent for a month in seconds
concurrent = 200
q=Queue(concurrent*2)
top_twenty = list() # returned to front end

app = Flask(__name__)

# METHODS


def doWork():
    while True:
        current_tuple=q.get()
        print '\nCurrent Tuple: ', current_tuple
        uid = current_tuple[0]
        url = current_tuple[1]
        score = current_tuple[2]
        data, url=getData(url)
        doSomethingWithResult(data, uid, score)
        q.task_done()

def getData(ourl):
    try:
        data = json.loads(urllib.urlopen(ourl).read())
        return data, ourl
    except:
        return "error", ourl

def doSomethingWithResult(profile, uid, score):

    print 'PROFILE: ', profile
    print type(profile)
    print profile.keys()

    if 'statuses' in profile.keys():
       recent_status={}
       if 'data' in profile['statuses'].keys():
           if 'updated_time' in profile['statuses']['data'][0].keys():
               print '^^^^^^ &&&&&&& ', profile['statuses']['data'][0]['updated_time']
               recent_status['updated_time'] = profile['statuses']['data'][0]['updated_time']
           if 'message' in profile['statuses']['data'][0].keys():
               #print '^^^^^^ &&&&&&& ', profile['statuses']['data'][0]['message']
               print  '^^^^^^ ', profile['statuses']['data'][0], type(profile['statuses']['data'][0]) 
               recent_status['message'] = profile['statuses']['data'][0]['message']     
           print '/n/n **** RECENT ', recent_status
           global top_twenty
           if 'relationship_status' in profile.keys():
               top_twenty.append({'id': uid, 'score': score, 'name': profile['name'], 'gender': profile['gender'], 'relationship_status': profile['relationship_status'], 'link': profile['link'], 'picture': profile['picture']['data'], 'status': recent_status})
           else:
               top_twenty.append({'id': uid, 'score': score, 'name': profile['name'], 'gender': profile['gender'], 'link': profile['link'], 'picture': profile['picture']['data'], 'status': recent_status})
    else:
       if 'relationship_status' in profile.keys():
          top_twenty.append({'id': uid, 'score': score, 'name': profile['name'], 'gender': profile['gender'], 'relationship_status': profile['relationship_status'], 'link': profile['link'], 'picture': profile['picture']['data']})
       else:
          top_twenty.append({'id': uid, 'score': score, 'name': profile['name'], 'gender': profile['gender'], 'relationship_status': 'nill', 'link': profile['link'], 'picture': profile['picture']['data'] })


# ROUTERS

@app.route('/_getData')
def getAnyData():
    accessToken = request.args.get('a', '', type=unicode)
    uid = request.args.get('b', '', type=unicode)
    fetch_string = request.args.get('c', '', type=unicode)
    data = fetch_fb_functions.getData(accessToken, uid, fetch_string)
    return json.dumps(data)

@app.route('/_getProfile') 
def getProfile():
    accessToken = request.args.get('a', '', type=unicode)
    url = "https://graph.facebook.com/me?fields=id, name, gender, relationship_status, picture.height(200).width(200), link, statuses.limit(1).fields(message,updated_time) &access_token="+accessToken
    profile = json.loads(urllib.urlopen(url).read())
    print 'PROFILE: ',profile, type(profile)
    print profile['id']
    me=dict()
    for key in profile.keys():
        print "key: ", key
        if key=='picture':
            print profile[key]['data']
            me[key]=profile[key]['data']
        elif key == 'statuses':
            recent_status={}
            recent_status['updated_time'] = profile['statuses']['data'][0]['updated_time']
            recent_status['message'] = profile['statuses']['data'][0]['message']
            me['status'] = recent_status
            print me['status']
        else:
            print profile[key]
            me[key]=profile[key]
    print json.dumps(me)
    return json.dumps(me)

@app.route('/_getCloseFriends')
def getCloseFriends():
    accessToken = request.args.get('a', '', type=unicode)
    uid = request.args.get('b', '', type=unicode)
    print 'uid='+uid
    print 'in get close friends'
         
    print '@@@@@@@@@@@@@@@@@    Calculating'
    my_friends = fetch_fb_functions.getFriends(accessToken)
    if 'friends' not in my_friends.keys():
        print 'no friends'
        return json.dumps('')
    
    #print 'my friends'
    #print my_friends
      
    score_calculation.init_scores(my_friends['friends']['data'])

    fetch_string = 'photos, checkins, feed, links, family, inbox.limit(500), statuses' 
    data = fetch_fb_functions.getData(accessToken, uid, fetch_string)


    my_photos = fetch_fb_functions.getPhotos(accessToken)
    if my_photos != None:
       print 'my_photos'
       #print my_photos
       print my_photos['tagged']
       score_calculation.update_scores(my_photos['tagged'], 3)
       print my_photos['liked by']
       score_calculation.update_scores(my_photos['liked by'], 2)
       print my_photos['commented by']
       score_calculation.update_scores(my_photos['commented by'], 2)

    my_checkins = fetch_fb_functions.getCheckins(accessToken, uid) 
    print 'my_checkins'
    if my_checkins != None:
       print my_checkins['from']
       score_calculation.update_scores(my_checkins['from'], 4) 
    
       print my_checkins['tagged']
       score_calculation.update_scores(my_checkins['tagged'], 4) 
    
    my_feeds = fetch_fb_functions.getFeed(accessToken)
    if my_feeds != None:
       print 'my_feeds'
       print my_feeds['tagged']
       score_calculation.update_scores(my_feeds['tagged'], 3)
       print my_feeds['liked by']
       score_calculation.update_scores(my_feeds['liked by'], 2)
       print my_feeds['commented by']
       score_calculation.update_scores(my_feeds['commented by'], 2)
    
    my_family = fetch_fb_functions.getFamily(accessToken)
    print 'my_family'
    if my_family != None:
       print my_family
       score_calculation.update_scores_family(my_family, 3)

    my_status = fetch_fb_functions.get_status(accessToken, uid)
    if my_status != None:
       print 'my_status'
       print my_status['tagged']
       score_calculation.update_scores(my_status['tagged'], 3)
       print my_status['liked by']
       score_calculation.update_scores(my_status['liked by'], 2)
       print my_status['commented by']
       score_calculation.update_scores(my_status['commented by'], 2)

    my_links = fetch_fb_functions.getLinks(accessToken)
    if my_links != None:
       print 'my_links'
       print my_links['tagged']
       score_calculation.update_scores(my_links['tagged'], 3)
       print my_links['liked by']
       score_calculation.update_scores(my_links['liked by'], 2)
       print my_links['commented by']
       score_calculation.update_scores(my_links['commented by'], 2)

    my_inbox = fetch_fb_functions.getInbox(accessToken, uid)
    if my_inbox != None:
       print 'my_inbox'
       print my_inbox
       score_calculation.update_scores_inbox(my_inbox, 3)

    sorted_score_list = score_calculation.show_scores()

    print '++++',sorted_score_list
    if len(sorted_score_list) >=20:
       top_twenty_friends = sorted_score_list[len(sorted_score_list)-20:]
    else:
       top_twenty_friends = sorted_score_list

    highest_index = len(top_twenty_friends)-1
    print '?????? $$$$$$', top_twenty_friends
    
       
    highest = top_twenty_friends[highest_index][1]
    print 'highest: ', highest
  
    my_friends_scores=list() # set of scores to be stored in DB
    start_time = time.time()
    global q
    global concurrent
    q=Queue(concurrent*2) 
    for i in range(concurrent):
       t=Thread(target=doWork)
       t.daemon=True
       t.start()
    try:
       for list_elem in top_twenty_friends:
          url = "https://graph.facebook.com/" + list_elem[0] + "?fields=id, name, gender, relationship_status, picture.height(200).width(200), link, statuses.limit(1).fields(message,updated_time) &access_token="+accessToken
          print 'old score: ',list_elem[1]
          new_score = (list_elem[1]/highest)*100
          print'new score: ',new_score
          q.put((list_elem[0], url.strip(), new_score))  # insert tuple(uid, url, new_score) in queue
          my_friends_scores.append(Score(friend_uid=list_elem[0], score=new_score))
       q.join()
    except KeyboardInterrupt:
       sys.exit(1)
    print time.time() - start_time, "seconds"

    global top_twenty
    print '****><><><>',top_twenty, type(top_twenty)
    return json.dumps(top_twenty)
    
@app.route('/')
def index():
    return render_template('tokenfetch.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug = True)
