import urllib.request
import json
import os
import sys
import xml.etree.ElementTree as ET
import pygame
from pygame.locals import *
from time import *

# Initialise screen
pygame.init()
screen = pygame.display.set_mode((480, 300), pygame.FULLSCREEN)
pygame.display.set_caption('Infohub')

def getTemperature():
    response = urllib.request.urlopen("http://lateralus.dlinkddns.com/rest/newestKeysEndingWith/_degC")
    str_response = response.readall().decode('utf-8')
    data = json.loads(str_response)
    dataList = []
    for obj in data:
        dataList.append([obj["_id"]["device_id"], obj["value"]])
    return dataList

def getDax():
    response = urllib.request.urlopen("http://finance.yahoo.com/d/quotes.csv?s=^GDAXI&f=l1p2")
    str_response = response.readall().decode('utf-8')
    return str_response.replace("\"", " ").strip()

def getNews():
    response = urllib.request.urlopen("https://news.google.com/news?cf=all&hl=de&pz=1&ned=de&output=rss")
    str_response = response.readall().decode('utf-8')
    root = ET.fromstring(str_response)
    news = []
    for item in root[0].findall('item'):
        title = item.find('title').text
        news.append(title)
    return news

def stringWordSplit(inStr, maxChars):
    wordlist = inStr.split()
    out = []
    thisLen = 0
    thisStr = ""
    for word in wordlist:
        inklLen = thisLen + len(word) + 1
        if inklLen < maxChars:
            thisStr = thisStr + word + " "
            thisLen = thisLen + len(word) + 1
        else:
            out.append(thisStr)
            thisStr = word + " "
            thisLen = len(word) + 1
    out.append(thisStr)
    return out
    
def draw(newsItem, news, temps, dax):

    fontSize = 33
    newLine = fontSize
    charsPerLine = 30
    fontColor = (255,255,255)
    x = 5
    y = 5
    
    # Fill background
    asurf = pygame.image.load(os.path.join('data', 'background.png'))
    font = pygame.font.Font(os.path.join('data', 'UbuntuMono-R.ttf'), fontSize)
    
    for item in temps:
        aStr = item[0] + ": " + item[1]
        text = font.render(aStr, 1, fontColor)
        asurf.blit(text, (x,y))
        y = y + newLine

    text = font.render("DAX: " + dax, 1, fontColor)
    asurf.blit(text, (x,y))
    y = y + newLine
    y = y + newLine
    # Display news
    newsStrList = stringWordSplit(news[newsItem], charsPerLine)
    
    for line in newsStrList:
        text = font.render(line, 1, fontColor)
        textpos = (x, y)
        asurf.blit(text, textpos)
        y = y + newLine

    lt = localtime()
    zeit = strftime("%H:%M", lt)
    text = font.render(zeit, 1, fontColor)
    asurf.blit(text, (385, 5))

    # Blit everything to the screen
    screen.blit(asurf, (0, 0))
    pygame.display.flip()

def main():
    SEC_TILL_LOAD = 300
    SEC_TILL_DRAW = 10

    pygame.time.set_timer(USEREVENT + 1, SEC_TILL_LOAD * 1000)
    pygame.time.set_timer(USEREVENT + 2, SEC_TILL_DRAW * 1000)
    
    news = getNews()
    temps = getTemperature()
    dax = getDax()

    actNews = 0
    # Event loop
    while 1:
        for event in pygame.event.get():
            if event.type == KEYDOWN:
                pygame.quit(); sys.exit();
            elif event.type == USEREVENT + 1:
                news = getNews()
                temps = getTemperature()
                dax = getDax()
            elif event.type == USEREVENT + 2:
                actNews = actNews + 1
                if actNews >= len(news):
                    actNews = 0
                draw(actNews, news, temps, dax)
        
if __name__ == '__main__': main()
