var unirest = require('unirest');

exports.getPedoToday = function(req, res) {
    var user = req.params.user;
    var pass = req.params.pass;
    var msgTempl = '{"encrypt_type":"base64","query_text":"_q_","sign":"_s_","chartset":"utf-8","service":"_srv_","partner":"iwown","format":"json","sign_type":"md5"}';
    msgLogin = msgTempl.replace("_q_", "eyJlbWFpbCI6InByb2RpZ3k4NEBhcmNvci5kZSIsInBhc3N3b3JkIjoibXhweDM0c3Q5MiJ9");
    msgLogin = msgLogin.replace("_s_", "282A0553D40C1A3B5E1BF44F9473C9AA");
    msgLogin = msgLogin.replace("_srv_", "login");
    unirest.post('http://114.215.151.68:9088/iwown/iwown.iwown')
    .header('Content-Type', 'text/plain')
    .send(msgLogin)
    .end(function (response) {
      console.log(new Buffer(response.body.resp_text, 'base64').toString('ascii'));
      var payload = JSON.parse(new Buffer(response.body.resp_text, 'base64').toString('ascii'));
      //---------- TODO Neue Funktion#
      var sportQuery = '{"Data_type":"sport","endTime":"201512072359","granu":"day","password":"mxpx34st92","startTime":"201511300000","uid":_uid_}';
      sportQuery = sportQuery.replace("_uid_", payload.uid);
      msgData = msgTempl.replace("_q_", new Buffer(sportQuery).toString('base64'));
      msgData = msgData.replace("_s_", "274ACC28C639AE1A7E2020B3888BDFD1");
      msgData = msgData.replace("_srv_", "dlPedoData");
      console.log(msgData);
      unirest.post('http://114.215.151.68:9088/iwown/iwown.iwown')
      .header('Content-Type', 'text/plain')
      .send(msgData)
      .end(function (response) {
        console.log(response.body);
        res.send(response.body);
      });
    });
};
