let mode = "home";
let speed = 0;
//加速5段階(1~5) 減速9段階(緊急停止を含め10段階)(-1~-10)
let handol = 0;
let time = 0;
let distance = 5/*km*/;
let max_speed_json = { "'5'": 120, "'3'": 60 }
let max_speed = 120;
let is_atc = false
let use_ato = false
let platform = null
let poles = null
//start or end(最後の減速時)
let ato_mode = "start"
//スピードを5,4,3,2,1,0,-1,-2,-3,-4,-5,-6,-7,-8,-9,-10と加速率*10で書いていく
let speed_list = [5, 4, 3, 2, 1, 0, -0.5, -1, -1.5, -2, -2.5, -3, -3.5, -4, -5, -6]
//canvasの準備
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
window.onload = init
function init() {
  let xhr = new XMLHttpRequest();

  if (getParam('from')) {
    xhr.open('GET', 'https://my-site.chakkun1121haru.repl.co/save%20train%20game%20history?from=' + getParam('from'));
  } else {
    xhr.open('GET', 'https://my-site.chakkun1121haru.repl.co/save%20train%20game%20history');
  }
  xhr.onload = () => { }
  xhr.send();
}
function start_game() {
  ctx.fillstyle = 'black'
  //線路の描画
  ctx.beginPath();
  ctx.moveTo(490, 0);
  ctx.lineTo(430, 500);
  ctx.moveTo(510, 0);
  ctx.lineTo(570, 500);
  ctx.moveTo(600, 0);
  ctx.lineTo(700, 500);
  ctx.moveTo(610, 0);
  ctx.lineTo(800, 500);
  ctx.stroke();
  //前のやつの描画
  ctx.beginPath()
  ctx.fillStyle = '#75e8fa'
  ctx.moveTo(0, 490)
  ctx.rect(0, 490, 1000, 10)
  ctx.fill();
  //ゲーム画面表示
  document.getElementById('start_manu').style.display = "none";
  document.getElementById('game').style.display = "block";
  //距離を設定
  distance = document.getElementById('set_distance').value
  if (distance <= 0) {
    console.error('0以上で入力してください。')
    alert('0以上で入力してください')
    view_start_menu()
    return;
  }
  max_speed = document.getElementById('set_max_speed').value
  if (max_speed <= 0) {
    console.error('0以上で入力してください。')
    alert('0以上で入力してください')
    view_start_menu()
    return;
  }
  //変数リセット
  time = 0;
  handol = 0;
  speed = 0;
  poles = new Pole
  use_ato = document.getElementById('use_ato').checked;
  platform = null
  is_viewed_platform = false
  //操作するための関数を一部発火
  mode = "game";
  update_view_speed_and_handol = setInterval(view_speed_and_handol, 100);
  update_timer = setInterval(timer, 100);
  update_setSpeed = setInterval(setSpeed, 100);
  update_updateDistance = setInterval(updateDistance, 100)
  start_atc = setInterval(ATC, 100)
  if (use_ato) {
    start_ato = setInterval(ATO, 100)
  }
}
/**
*情報を表示
*/
function view_speed_and_handol() {
  if (mode == "game") {
    view_time = change_second_to_hour(time)
    //canvasをすべて消去
    ctx.clearRect(0, 0, 1000, 500);
    //線路の描画
    ctx.fillStyle = '#000'
    ctx.beginPath();
    ctx.moveTo(490, 0);
    ctx.lineTo(430, 500);
    ctx.moveTo(510, 0);
    ctx.lineTo(570, 500);
    ctx.moveTo(600, 0);
    ctx.lineTo(700, 500);
    ctx.moveTo(610, 0);
    ctx.lineTo(800, 500);
    ctx.stroke();
    //前のやつの描画
    ctx.beginPath()
    ctx.fillStyle = '#75e8fa'
    ctx.moveTo(0, 490)
    ctx.rect(0, 490, 1000, 10)
    ctx.fill();
    //ホーム表示
    if (platform) {
      ctx.fillStyle = '#eee'
      platform.move()
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(0, platform.y);
      ctx.lineTo(platform.x, platform.y)
      ctx.lineTo(480, 0)
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'yellow'
      ctx.beginPath()
      ctx.moveTo(465, 0)
      ctx.lineTo(platform.x - 15, platform.y);
      ctx.lineTo(platform.x - 10, platform.y)
      ctx.lineTo(470, 0)
      ctx.closePath();
      ctx.fill();
    }
    //情報描画
    ctx.fillStyle = 'black'
    ctx.font = '15px sans-serif'
    //経過時間描画
    document.getElementById('time').innerText = view_time[0] + '時間' + view_time[1] + '分' + view_time[2] + '秒';
    ctx.fillText("経過時間:" + view_time[0] + '時間' + view_time[1] + '分' + view_time[2] + '秒', 10, 150)
    //speed
    document.getElementById('speed').innerText = Math.round(speed);
    ctx.fillText('スピード:' + Math.round(speed) + 'km/h', 10, 75);
    //最高速度
    document.getElementById('max_speed').innerText = max_speed;
    ctx.fillText('この区間の最高速度:' + max_speed + 'km/h', 10, 100);
    if (Math.round(speed) > max_speed) {
      document.getElementById('speed').style.background = "red";
    } else {
      document.getElementById('speed').style.background = "none";
    }
    //距離
    if (distance > 1) {
      document.getElementById('distance').innerText = Math.round(distance * 100) / 100 + 'km'
      ctx.fillText('ゴールまでの距離:' + Math.round(distance * 100) / 100 + 'km', 10, 50);

    } else {
      document.getElementById('distance').innerText = Math.round(distance * 1000 * 10) / 10 + 'm'
      ctx.fillText('ゴールまでの距離:' + Math.round(distance * 1000 * 10) / 10 + 'm', 10, 50);
    }
    //マスコンハンドルの位置を書く
    if (handol >= 1) {
      document.getElementById('handol').innerText = '加速' + handol
      ctx.fillText('マスコンハンドル:加速' + handol, 10, 125)
    } else if (handol == 0) {
      document.getElementById('handol').innerText = '0'
      ctx.fillText('マスコンハンドル:0', 10, 125)
    } else if (handol == -9) {
      document.getElementById('handol').innerText = '緊急停止'
      ctx.fillText('マスコンハンドル:緊急停止', 10, 125)
    } else if (handol < 0) {
      document.getElementById('handol').innerText = '減速' + Math.abs(handol)
      ctx.fillText('マスコンハンドル:減速' + Math.abs(handol), 10, 125)
    }
  }
  //周りの電柱を書く

  if (poles) {
    poles.move()
  }
  if (poles) {
    if (!is_viewed_platform) {
      ctx.fillRect(poles.xright, poles.yright, 10, 500)
      ctx.fillRect(poles.xleft, poles.yleft, 10, 500)
      ctx.fillRect(poles.xleft, poles.yleft, poles.xright + 10 - poles.xleft, 10)
    }
  }


}

class Pole {
  /**
  *電柱の位置を保管するclass
  */
  constructor() {
    this.xright = 630
    this.yright = -500
    this.xleft = 470
    this.yleft = -500
  }
  move() {
    this.xright += 190 * speed / 500
    this.yright += speed
    this.xleft -= speed * 60 / 500
    this.yleft += speed
    if (this.yright >= 50) {
      poles = null
    }
  }
}
class Platform {
  constructor() {
    //右下の点の座標
    this.x = 470
    this.y = 0
  }
  move() {
    this.x -= 60 * speed / 500
    this.y += speed
  }
}
/**
*タイマー(100ミリ秒ごとに呼び出し、加算)
*/
function timer() {
  if (mode == "game") {
    time = time + 0.1;
    time = Math.round(time * 10) / 10
  }
}
//距離、スピード、最高速度計算
let is_viewed_platform = false;
function updateDistance() {
  if (mode == "game") {
    distance = distance - (speed / 3600 / 10)
    if (Math.round((distance * 1000) % 20 / 2) * 2 == 0) {
      poles = new Pole;
    }
    if (distance * 1000 <= 200) {
      //ホームの表示
      if (!is_viewed_platform) {
        platform = new Platform;
        is_viewed_platform = true
      }
    }
    if (distance <= 0.0001) {
      if (speed == 0) {
        //ゲームを終了
        finish_game();
      }
    }
  }
}
/**
*スピード設定
*/
function setSpeed() {
  if (mode == "game") {
    switch (handol) {
      case 5:
        speed = speed + speed_list[0] / 10
        break;
      case 4:
        speed = speed + speed_list[1] / 10
        break;
      case 3:
        speed = speed + speed_list[2] / 10
        break
      case 2:
        speed = speed + speed_list[3] / 10
        break
      case 1:
        speed = speed + speed_list[4] / 10
        break
      case 0:
        speed = speed + speed_list[5] / 10
        break
      case -1:
        speed = speed + speed_list[6] / 10
        break
      case -2:
        speed = speed + speed_list[7] / 10
        break
      case -3:
        speed = speed + speed_list[8] / 10
        break
      case -4:
        speed = speed + speed_list[9] / 10
        break;
      case -5:
        speed = speed + speed_list[10] / 10
        break
      case -6:
        speed = speed + speed_list[11] / 10
        break
      case -7:
        speed = speed + speed_list[12] / 10
        break
      case -8:
        speed = speed + speed_list[13] / 10
        break
      case -9:
        speed = speed + speed_list[14] / 10

    }
    if (speed < 0) {
      speed = 0;
    }
  }
}
/**
*ATCの設定
*/
function ATC() {
  if (mode == "game") {
    if (speed > Math.round(max_speed) + 10 || distance < 0) {
      //ATCブレーキ作動
      handol = -9;
      document.getElementById("atc").style.dispay = "block"
      is_atc = true
    } else {
      //解除
      if (is_atc) {
        handol = 0
        is_atc = false
      }
      document.getElementById('atc').style.dispay = "none"

    }
  }
}
//ATO自動運転装置
function ATO() {
  if (ato_mode == 'start') {
    if (!is_atc) {
      handol = 5
    }
    //-5での減速開始位置を計算
    if (distance <= start_deceleration) {
      ato_mode = 'end';
      handol = -5
    } else if (ato_mode == 'end') {
      handol = -5
      //定期的に再計算
    }
  }
}
/**
  *ゲームを終了
  */
function finish_game() {
  //ゲーム画面から結果画面に移動
  document.getElementById('start_manu').style.display = "none";
  document.getElementById('game').style.display = "none";
  document.getElementById('result_game').style.display = "block";
  //ゲーム用の定期実行関数終了
  clearInterval(update_view_speed_and_handol)
  clearInterval(update_timer)
  clearInterval(update_setSpeed)
  clearInterval(update_updateDistance)
  clearInterval(start_atc)
  //結果表示
  document.getElementById('result_distance_m').innerText = Math.round((distance * 1000) * 100) / 100;
  result_time = change_second_to_hour(time);
  document.getElementById('result_time').innerText = result_time[0] + '時間' + result_time[1] + '分' + result_time[2] + '秒';
}
/**
*ホーム画面表示
*/
function view_start_menu() {
  document.getElementById('start_manu').style.display = "block";
  document.getElementById('game').style.display = "none";
  document.getElementById('result_game').style.display = "none";
}
//キーボードショートカット用
hotkeys('up,down', function(event, handler) {
  if (mode == 'game') {
    if (!use_ato) {
      event.preventDefault();
      switch (handler.key) {
        case 'up':
          if (handol > -9) {
            handol = handol - 1
          }
          break;
        case 'down':
          if (handol <= 4) {
            handol++
          }
          break;
      }
    }
  }
})
function button_key(key) {
  switch (key) {
    case 'up':
      if (handol > -9) {
        handol = handol - 1
      }
      break;
    case 'down':
      if (handol <= 4) {
        handol++
      }
      break;
  }
}
//ライブラリみたいなやつ
/**
  *秒を時間、分、秒に換算します。
  *@param {Number} 変換する秒
  *@retunn {Array} 時間、分、秒の順で入っている配列
  */
function change_second_to_hour(input_second) {
  let hour = Math.floor(input_second / 3600);
  let min = Math.floor(input_second % 3600 / 60);
  let rem = Math.round(input_second % 60);
  return [hour, min, rem]
}
function updata() {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    // 登録されているworkerを全て削除する
    for (let registration of registrations) {
      registration.unregister();
    }
  });
  caches.keys().then(function(keys) {
    var promises = [];
    // キャッシュストレージを全て削除する
    keys.forEach(function(cacheName) {
      if (cacheName) {
        promises.push(caches.delete(cacheName));
      }
    });
  });
  window.location.reload();
}
function getParam(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}