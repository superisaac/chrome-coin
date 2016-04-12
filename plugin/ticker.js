var records = {};
var tickers = [];
var storageKey = 'btcticker.records';
var rateKey = 'usd.vs.cny';

var usdVSCny = localStorage.getItem(rateKey);
if (!usdVSCny) {
  usdVSCny = 6.489;
}

var localRecords = localStorage.getItem(storageKey);
if (localRecords) {
  try {
	  records = JSON.parse(localRecords);
  } catch(e) {
	  console.error(e);
  }
}

function toFloat(v, digits) {
  var r = Math.pow(10, digits);
  v = Math.floor(parseFloat(v) * r) / r;
  return v;
}

function loadJSON(url, callback) {
  var request = new XMLHttpRequest();
  request.onreadystatechange = function() {
	  if(request.readyState == 4) {
	    try {
		    var data = JSON.parse(request.responseText);
		    callback(null, data);
	    } catch(e) {
		    callback(e, null);
	    }
	  }
  };
  request.open('GET', url, true);
  request.send(null);
}

function refreshRecords(lastMarket) {
  var tableContent = '<tr>' + 
	  '<th class="name">市场</th>' + 
	  '<th class="last">最新</th>' + 
	  '<th class="low">最低</th>' +
	  '<th class="high">最高</th>' +
	  '<th class="vol">成交量</th>' +
	  '</tr>';

  tickers.forEach(function(ticker) {
	  var r = records[ticker.market];
	  if(!r) {
	    return;
	  }
	  var tr = ticker.makeRow(r, lastMarket);
	  tableContent += tr;
  });
  var table = document.getElementById('price');
  table.innerHTML = tableContent;
}

function addTicker(opts) {
  var ticker = opts;
  ticker.load = function() {
	  loadJSON(ticker.url,
		         function(err, data) {
		           if(!!err) {
			           return;
		           }
		           var r = ticker.filter.apply(ticker,
						                               [data]);
		           if (r) {
			           ticker.addRecord(r);
		           }
		         });
  };

  ticker.addRecord = function(record) {
	  var oldR = records[ticker.market];
	  record.timestamp = new Date().getTime();
	  if (oldR) {
	    if(oldR.mean &&
	       record.timestamp - oldR.timestamp < 3600000) {
		    record.mean = (oldR.mean * 59 + record.last) / 60.0;
	    } else {
		    record.mean = record.last;
	    }
	  }
	  records[ticker.market] = record;
	  localStorage.setItem(storageKey, JSON.stringify(records));
	  if(oldR && oldR.last == record.last) {
	    return;
	  }
	  refreshRecords(ticker.market);
  };

  ticker.makeRow = function (r, lastMarket) {
	  function makeTd(cls, value) {
	    return '<td class="' + cls + '">' + value + '</td>';
	  }
	  var clsname = ticker.market;
	  var dir = '';
	  if (r.last > r.mean) {
	    clsname += ' trend-up';
	    dir = '↑';
	  } else if (r.last < r.mean) {
	    //} else {
	    clsname += ' trend-down';
	    dir = '↓';
	  }
	  if (ticker.market == lastMarket) {
	    clsname += ' last-market';
	  }
	  var tr = '<tr class="' + clsname + '">';
	  var namecol = ticker.name;
	  if(ticker.site) {
	    namecol = '<a href="' + ticker.site + '">' + ticker.name + '</a>';
	  }
	  tr += makeTd('name', namecol);
	  tr += makeTd('last', dir + ticker.c + toFloat(r.last, 2));
	  tr += makeTd('low', ticker.c + toFloat(r.low, 2));
	  tr += makeTd('high', ticker.c + toFloat(r.high, 2));
	  tr += makeTd('vol', toFloat(r.vol, 2));
	  tr += '</tr>';
	  return tr;
  };
  tickers.push(ticker);
}

/*addTicker({
  'market': 'mtgox',
  //'site': 'https://www.mtgox.com',
  'name': 'MtGox',
  'c': '$',
  'url': 'https://data.mtgox.com/api/1/BTCUSD/ticker',
  'filter': function(data) {
	data = data['return'];
	var record = {
	'last': data.last.value,
	'sell': data.sell.value,
	'buy': data.buy.value,
	'high': data.high.value,
	'low': data.low.value,
	'vol': data.vol.value
	};
	return record;
  }
  }); */

addTicker({
  'market': 'bitstamp',
  'name': 'BitStamp',
  'c': '$',
  'url': 'https://www.bitstamp.net/api/ticker/',
  'filter': function(data) {
	  var record = data;
	  record['vol'] = record['volume']
	  return record;
  }
});

addTicker({
  'market': 'btce',
  'name': 'BTC-E',
  'c': '$',
  'url': 'https://btc-e.com/api/2/btc_usd/ticker',
  'filter': function(data) {
	  var record = data.ticker;
	  record.vol = record.vol_cur;
	  return record;	
  }
});

addTicker({
  'market': 'btcchina',
  'name': '比特币中国',
  'c': '¥',
  'url': 'https://data.btcchina.com/data/ticker',
  'filter': function(data) {
	  var record = data['ticker'];
	  return record;
  }
});

addTicker({
  'market': 'haobtc',
  'name': '好比特币',
  'c': '¥',
  'url': 'https://haobtc.com/api/v1/price/cny',
  'filter': function(data) {
	  var record = data;
    record.last = (parseFloat(record.sell) + parseFloat(record.buy))/2;
/*    record.high = record.last;
    record.low = record.last; */
	  return record;
  }
});

addTicker({
  'market': 'okcoin',
  'name': 'OKCoin',
  'c': '¥',
  'url': 'https://www.okcoin.cn/api/v1/ticker.do?symbol=btc_cny',
  'filter': function(data) {
	  var record = data.ticker;
    record.time = data.date;
	  return record;
  }
});

addTicker({
  'market': 'okcoin_this_week',
  'name': 'OKCoin(Week)',
  'c': '¥',
  'url': 'https://www.okcoin.com/api/v1/future_ticker.do?symbol=btc_usd&contract_type=this_week',
  'filter': function(data) {
	  var record = data.ticker;
    record.last = usdVSCny * record.last;
    record.buy = usdVSCny * record.buy;
    record.sell = usdVSCny * record.sell;
    record.high = usdVSCny * record.high;
    record.low = usdVSCny * record.low;
    record.time = data.date;
	  return record;
  }
});

addTicker({
  'market': 'okcoin_next_week',
  'name': 'OKCoin(NextWeek)',
  'c': '¥',
  'url': 'https://www.okcoin.com/api/v1/future_ticker.do?symbol=btc_usd&contract_type=next_week',
  'filter': function(data) {
	  var record = data.ticker;
    record.last = usdVSCny * record.last;
    record.buy = usdVSCny * record.buy;
    record.sell = usdVSCny * record.sell;
    record.high = usdVSCny * record.high;
    record.low = usdVSCny * record.low;

    record.time = data.date;
	  return record;
  }
});

addTicker({
  'market': 'okcoin_quarter',
  'name': 'OKCoin(Quarter)',
  'c': '¥',
  'url': 'https://www.okcoin.com/api/v1/future_ticker.do?symbol=btc_usd&contract_type=quarter',
  'filter': function(data) {
	  var record = data.ticker;
    record.last = usdVSCny * record.last;
    record.buy = usdVSCny * record.buy;
    record.sell = usdVSCny * record.sell;
    record.high = usdVSCny * record.high;
    record.low = usdVSCny * record.low;
    
    record.time = data.date;
	  return record;
  }
});

/*addTicker({
  'market': 'f796',
  'name': '796期货',
  'c': '$',
  'url': 'http://api.796.com/apiV2/ticker.html?op=futures',
  'filter': function(data) {
	  var record = data['return'];
	  return record;
  }
}); */

//LTC
/*addTicker({
  'market': 'btceltc',
  'name': 'BTC-E(LTC)',
  'c': '$',
  'url': 'https://btc-e.com/api/2/ltc_usd/ticker',
  'filter': function(data) {
	  var record = data['ticker'];
	  record.vol = record.vol_cur;
	  return record;
  }
});
*/

/*addTicker({
  'market': 'okcoinltc',
  'name': 'OKCoin(LTC)',
  'c': '¥',
  'url': 'https://www.okcoin.cn/api/v1/ticker.do?symbol=ltc_cny',
  'filter': function(data) {
	  var record = data['ticker'];
    record.time = data.date;
	  return record;
  }
}); */

addTicker({
  'market': 'huobi',
  'name': '火币网',
  'c': '¥',
  //'url': 'http://market.huobi.com/staticmarket/ticker_btc_json.js',
  'url': 'http://api.huobi.com/staticmarket/ticker_btc_json.js',
  'filter': function(data) {
	  var record = data['ticker'];
	  return record;
  }
});

/*addTicker({
  'market': 'huobiltc',
  'name': '火币网(LTC)',
  'c': '¥',
  //'url': 'http://market.huobi.com/staticmarket/ticker_ltc_json.js',
  'url': 'http://api.huobi.com/staticmarket/ticker_ltc_json.js',
  'filter': function(data) {
	  var record = data['ticker'];
	  return record;
  }
});
*/
document.addEventListener('DOMContentLoaded', function() {
  refreshRecords();
  tickers.forEach(function(ticker) {
	  ticker.load();
	  setTimeout(function() {
	    setInterval(function() {
		    ticker.load();
	    }, 10000);
	  }, Math.random() * 10000);
  });

  loadJSON("https://www.okcoin.com/api/v1/exchange_rate.do", function(err, body) {
    if(!err) {
      usdVSCny = body.rate;
      localStorage.setItem(rateKey, "" + usdVSCny);
    } else {
      console.error(err);
    }
  });
});

