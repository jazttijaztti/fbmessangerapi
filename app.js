
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
'use strict';

// Imports dependencies and set up http server
const 
  request = require('request'),
  express = require('express'),
  body_parser = require('body-parser'),
  app = express().use(body_parser.json()); // creates express http server

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));


// Accepts POST requests at /webhook endpoint
app.post('/webhook', (req, res) => {

  //この関数はFBメッセンジャーのプロフィールに必要なフィールドを申請するための関数です。
  //setFBMessangerDefault();
  

  // Parse the request body from the POST
  let body = req.body;
console.log("FBの種別は"+body.object);
  // Check the webhook event is from a Page subscription
  if (body.object === 'page') {
    // Iterate over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {

      // Gets the body of the webhook event
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);

      // Get the sender PSID
      let sender_psid = webhook_event.sender.id;
      console.log('送信者のPSIDは'+sender_psid);
      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) {
        console.log("handle関数の方:ユーザが何かメッセしたら定型を返すってやつだけど多分これはいらない")
        //handleMessage(sender_psid, webhook_event.message);
        leadersNoticeSend();
      } else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback);
        console.log("postbackの方")
      } 
    });

    // Return a '200 OK' response to all events
    res.status(200).send('EVENT_RECEIVED');

  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});

// Accepts GET requests at the /webhook endpoint
app.get('/webhook', (req, res) => {
  
  /** UPDATE YOUR VERIFY TOKEN **/
  const VERIFY_TOKEN = "b35ebdc53ecbf225ffc603b10b04みたいな感じ";
  

    // Parse params from the webhook verification request
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    // Check if a token and mode were sent
    if (mode && token) {

      // Check the mode and token sent are correct
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {

        // Respond with 200 OK and challenge token from the request
        console.log('WEBHOOK_VERIFIED');
        res.status(200).send(challenge);

      } else {
        // Responds with '403 Forbidden' if verify tokens do not match
        res.sendStatus(403);      
      }
    }
});


// Handles messages events
//この関数はメッセージされたら、自動でレスポンスする内容を決めてるだけ
//最後のcallsendapiで送信してる
function handleMessage(sender_psid, received_message) {
  let response;

  // Checks if the message contains text
  if (received_message.text) {
    
    // Creates the payload for a basic text message, which
    // will be added to the body of our request to the Send API
    response = {
      "text": `You sent the message: "${received_message.text}". Now send me an attachment!`
    }

  } else if (received_message.attachments) {
  
    // Gets the URL of the message attachment
    let attachment_url = received_message.attachments[0].payload.url;
  
  } 
  
  // Sends the response message
  callSendAPI(sender_psid, response);  
}

// 一番初めにスタートって押した時の挙動
function handlePostback(sender_psid, received_postback) {
  
  //console.log(received_postback);
  var uuid = '';
  if (Object.keys(received_postback.referral.ref).length !== 0) {
    uuid = received_postback.referral.ref;
    //uuidの操作はここの中だけで終わらせる
    //uuidを見てpsidがすでに入ってるかどうかを確認する
  }
  let response = {
    "text": received_postback.payload
  }
  
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response
  }
  
  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log("u_idを取得し、psidも取得しました。")
      
    } else {
      console.error("エラーです。" + err);
    }
  }); 
}


//申請用の関数
function setFBMessangerDefault(){
  let request_body = {
    "get_started": {
      "payload": "承認ありがとうございますはXXXXXです。"
    },
    "account_linking_url": "https://prickle-limit.glitch.me/webhook"
  } 
  console.log("申請開始");
request({
  "url" : "https://graph.facebook.com/v2.6/me/messenger_profile",
  "qs": {access_token: PAGE_ACCESS_TOKEN },
  "method": "POST",
  "json": request_body
}, (err, res ,body) => {
    if (!err) {
      console.log('初期値の登録に成功しました。');
      console.log(body)
      
    } else {
      console.error("初期値の登録ができなかった" + err);
    }
});
}

function leadersNoticeSend(psid , noticeInfo){
  
  let response;
  //var userName = noticeInfo.name;
  //var message =  noticeInfo.text;
  //テスト用のpsid、この値は適当です。    
  var psid = 227392571595766e15315152;
  var message = "あとは誰かがやってくるかなかな。。。";
  
  response = {
    "text": `LEADERSです。"${message}". `
  }

  
  // Sends the response message
  callSendAPI(psid, response);  
}


// FBページを使ってメッセージを送信する本体
function callSendAPI(sender_psid, response) {
  // Construct the message body
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response
  }

  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log("無事送信されています。")
    } else {
      console.error("エラーです。" + err);
    }
  }); 
  
}

