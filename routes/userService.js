exports.login = function(req, res) {
  var username = req.body.username || '';
  var password = req.body.password || '';

  if (username == '' || password == '') {
    return res.send(401);
  }

  if (username === 'reineckm' && password === 'reineckm') {
    var token = jwt.sign(user, secret.secretToken, { expiresInMinutes: 60 });
    return res.json({token:token});
  } else {
    return res.send(401);
  }
};
