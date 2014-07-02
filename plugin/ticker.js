var records = {};
var tickers = [];
var storageKey = 'btcticker.records';

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
    'market': 'okcoin',
    'name': 'OKCoin',
    'c': '¥',
    'url': 'https://www.okcoin.com/api/ticker.do',
    'filter': function(data) {
	var record = data['ticker'];
	return record;
    }
});

/*addTicker({
    'market': 'chbtc',
    'name': '中国比特币',
    'c': '¥',
    'url': 'http://www.chbtc.com/data/ticker',
    'filter': function(data) {
	var record = data['ticker'];
	return record;
    }
}); */

addTicker({
    'market': 'fxbtc',
    'name': 'FXBTC',
    'c': '¥',
    'url': 'https://data.fxbtc.com/api?op=query_ticker&symbol=btc_cny',
    'filter': function(data) {
	var record = data['ticker'];
	record.last = record.last_rate;
	return record;
    }
});

/*addTicker({
    'market': 'goxbtc',
    'name': 'GOXBTC',
    'c': '¥',
    'url': 'https://goxbtc.com/api/new/btc_cny/ticker.htm',
    'filter': function(data) {
	var record = data['ticker'];
	return record;
    }
}); */

addTicker({
    'market': 'f796',
    'name': '796期货',
    'c': '$',
    'url': 'http://api.796.com/apiV2/ticker.html?op=futures',
    'filter': function(data) {
	var record = data['return'];
	return record;
    }
});

//LTC
addTicker({
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

addTicker({
    'market': 'okcoinltc',
    'name': 'OKCoin(LTC)',
    'c': '¥',
    'url': 'http://www.okcoin.com/api/ticker.do?symbol=ltc_cny',
    'filter': function(data) {
	var record = data['ticker'];
	return record;
    }
});

/*addTicker({
    'market': 'fxbtcltc',
    'name': 'FXBTC(LTC)',
    'c': '¥',
    'url': 'https://data.fxbtc.com/api?op=query_ticker&symbol=ltc_cny',
    'filter': function(data) {
	var record = data['ticker'];
	record.last = record.last_rate;
	return record;
    }
}); */

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
});

