# My Line bot assistance

## Thing 1: Do the Lab from Codelab

<https://codelab.line.me>

- [x] Building GenAI Chatbot using Gemini and Firebase
- [x] Building Gold Reporter Chatbot using Firebase and Web Scraping technique
- [x] Building Image Resizer Chatbot using Firebase
- [x] Building LINE Chatbot using Dialogflow
  - [x] <https://wutthipong.medium.com/ทำ-line-chatbot-เชื่อมกับ-dialogflow-และ-gemini-โดยเลือกถามคนหรือถามบอทได้-ตอนที่-1-line-เชื่อมกับ-02b9840f0f6d>
  - [x] <https://wutthipong.medium.com/ทำ-line-chatbot-เชื่อมกับ-dialogflow-และ-gemini-โดยเลือกถามคนหรือถามบอทได้-ตอนที่-2-line-เชื่อมกับ-4e16570bf745>
- [ ] ChatGPT bot in LINE Group to answer all of your questions!
  - <https://medium.com/linedevth/line-chatgpt-group-9b2fc5ea94d3>
- [ ] Building Shorten URL Chatbot using Dialogflow and Bitly API
- [ ] Handle Non-Text Event with Dialogflow
- [ ] Building Package Tracking Chatbot with ThailandPost API
- [ ] Let's build a cool Jukebox Chatbot in LINE via Spotify API
- [ ] Create LINE Chatbot to extract audio files in Thai with Google Speech-to-Text API
- [ ] Create a Remove background Chatbot and travel the world in 1 second!
- [ ] Create Digital Business Cards without Writing Code using Flex Simulator
- [ ] Easily create a Translation Chatbot with Firebase Extensions
- [ ] Building LIFF app without caching
- [ ] Extend Functionality to your LIFF app by LIFF Plugin

### Flow Chart

```mermaid
---
title: This flow for the lab
---
sequenceDiagram
  actor User
  par add friend process
    User->>Line: add Assistant bot
  end

  par Building Gold Reporter Chatbot using Firebase and Web Scraping technique
    Pubsub-->>Gold: Snap web
    Pubsub-->>Firestore: Save the data (if there are changes)
    Pubsub-->>Line: broadcast Flex Gold to Line user
  end

  par Gemini x Dialogflow
    alt message.type = text
      alt select mode
        User->>Line: mode
        Line-->>Function: call webhook
        Function-->>Line: get User Profile
        Function-->>Firestore: get the userMode
        Function-->>Line: quickReply Bot/Staff
      else gemini
        User->>Line: gemini
        Function-->>Firestore: update user mode to gemini
        Function-->>Line: already updated user mode to gemini
      else bot
        User->>Line: bot
        Function-->>Firestore: update user mode to bot
        Function-->>Line: already updated user mode to bot
      else staff
        User->>Line: staff
        Function-->>Firestore: update user mode to staff
        Function-->>Line: already updated user mode to staff
      end

      alt userMode = staff
        Function-->>NodeCache: update notifyStatus by user id
        Function-->>Notify: noti to staff that user needs an answer
        Function-->>Line: waiting for an answer
      else userMode = gemini
        User->>Line: Questionnaire
        Function-->>Gemini: get an answer
        Function-->>Line: calling loading
        alt answer = don't know the answer
          Function-->>Line: quickReply Staff (do you want to ask Staff)
        else
          Function-->>Line: send the answer in the name of Gemini (sender)
        end
      else userMode = bot
        Function-->>Dialogflow: call the dialogflow api
        Note over Function,Dialogflow: go to the case in dialogflow
      end
    else message.type = image
      User->>Line: image
      Line-->>Function: call webhook
      Function-->>Storage:  save the image
      Storage-->>Function: resize the image
      Function-->>gemini: get an answer
      Function-->>Line: send the resized image in Flex with message from gemini
    end
  end
```

```mermaid
---
title: Dialogflow
---
flowchart TB
  start([start])-->msg[/input text/]
  msg-->greetings{greetings ?}
  greetings-->|Yes|opt1(send the message greeting)
  opt1-->saveCache(save userID and mode)
  greetings-->|No|IBM{Am I fat?}
  IBM-->|Yes|opt2(calculate the IBM)
  opt2-->IBMmsg(send the Line back)
  IBMmsg-->saveCache
  IBM-->|No|falloutOpt1(get uerID)
  falloutOpt1-->falloutOpt2(get replyToken)
  falloutOpt2-->falloutOpt3{mode?}
  falloutOpt3-->|staff|falloutOpt4{already noti to staff?}
  falloutOpt4-->|Yes|falloutOpt5(save userid to cache)
  falloutOpt4-->|No|falloutOpt6(send noti to staff)
  falloutOpt6-->falloutOpt5
  falloutOpt5-->falloutOpt7(send the msg: wait for staff)
  falloutOpt7-->saveCache
  falloutOpt3-->|bot|falloutOpt8(ask gemini)
  falloutOpt8-->falloutOpt9(send the answer from gemini back)
  falloutOpt9-->saveCache
  falloutOpt3-->|else: dialogflow|falloutOpt10(send the quickreply: 2 options BOT/Staff)
  falloutOpt10-->saveCache
  saveCache-->stop([end])
```

### Flow Chart (revised)

```mermaid
---
title: This flow for the lab
---
sequenceDiagram
  actor User
  par add friend process
    User->>Line: add Assistant bot
  end

  par Building Gold Reporter Chatbot using Firebase and Web Scraping technique
    Pubsub-->>Gold: Snap web
    Pubsub-->>Firestore: Save the data (if there are changes)
    Pubsub-->>Line: broadcast Flex Gold to Line user
  end

  par Gemini x Dialogflow
    alt message.type = text
      Function-->>Dialogflow: call the dialogflow api
      Note over Function,Dialogflow: go to the case in dialogflow
    else message.type = image
      User->>Line: image
      Line-->>Function: call webhook
      Function-->>Storage:  save the image
      Storage-->>Function: resize the image
      Function-->>gemini: get an answer
      Function-->>Line: send the resized image in Flex with message from gemini
    end
  end
```

```mermaid
---
title: Dialogflow
---
flowchart TB
  start([start])-->msg[/input text/]
  msg-->greetings{greetings ?}
  greetings-->|Yes|opt1(send the message greeting)
  opt1-->saveCache(save userID and mode)
  greetings-->|No|IBM{Am I fat?}
  IBM-->|Yes|opt2(calculate the IBM)
  opt2-->IBMmsg(sent back to line)
  IBMmsg-->saveCache
  IBM-->|No|falloutOpt1(get uerID)
  falloutOpt1-->falloutOpt2(get replyToken)
  falloutOpt2-->falloutOpt3{mode?}
  falloutOpt3-->|gemini|falloutOpt4(ask gemini)
  falloutOpt4-->falloutOpt5(save to firestore)
  falloutOpt3-->|chatGPT|falloutOpt6(ask chatGPT)
  falloutOpt6-->falloutOpt5(save to firestore)
  falloutOpt3-->|pat|falloutOpt7(noti to pat)
  falloutOpt7-->falloutOpt5(save to firestore)
  falloutOpt5-->stop([end])
  saveCache-->stop([end])
```

## Thing 2: Test Our Idea
