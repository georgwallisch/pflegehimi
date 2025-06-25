const ajax_url = "ajax.php";

var min_search_length = 0;
var searchStartTimeout = null;
const searchStartDelay = 300;

var apo = null;

const pflegehimi54 = [
	{'bez':'Bettschutzeinlagen Einmalgebrauch', 'hpn':'54.45.01.0001', 'ep':0.44, 'q':'St', 'f':1},
	{'bez':'Fingerlinge', 'hpn':'54.99.01.0001', 'ep':0.06, 'q':'St', 'f':1},
	{'bez':'Einmalhandschuhe', 'hpn':'54.99.01.1001', 'ep':0.09, 'q':'St', 'f':1},
	{'bez':'Medizinische Gesichtsmasken', 'hpn':'54.99.01.2001', 'ep':0.14, 'q':'St', 'f':1},
	{'bez':'Partikelfiltrierende Halbmasken', 'hpn':'54.99.01.5001', 'ep':0.80, 'q':'St', 'f':1},
	{'bez':'Schutzschürzen Einmalgebrauch', 'hpn':'54.99.01.3001', 'ep':0.13, 'q':'St', 'f':1},
	{'bez':'Schutzschürzen wiederverwendbar', 'hpn':'54.99.01.3002', 'ep':21.00, 'q':'St', 'f':1},
	{'bez':'Schutzservietten Einmalgebrauch', 'hpn':'54.99.01.4001', 'ep':0.13, 'q':'St', 'f':1},
	{'bez':'Händedesinfektionsmittel', 'hpn':'54.99.02.0001', 'ep':1.40, 'q':'ml', 'f':100},
	{'bez':'Flächendesinfektionsmittel', 'hpn':'54.99.02.0002', 'ep':1.30, 'q':'ml', 'f':100},
	{'bez':'Händedesinfektionstücher', 'hpn':'54.99.02.0014', 'ep':0.18, 'q':'St', 'f':1},
	{'bez':'Flächendesinfektionstücher', 'hpn':'54.99.02.0015', 'ep':0.17, 'q':'St', 'f':1}
];

const quickies = [
	{'bez':'Karton Bettschutzeinlagen Einmalgebrauch (50 St)', 'hpn':'54.45.01.0001', 'me':50},
	{'bez':'Packung Einmalhandschuhe (100 St)', 'hpn':'54.99.01.1001', 'me':100},
	{'bez':'500ml Händedesinfektionsmittel', 'hpn':'54.99.02.0001', 'me':5},
	{'bez':'500ml Flächendesinfektionsmittel', 'hpn':'54.99.02.0002', 'me':5},
	{'bez':'Packung Descosept Flächendesinfektionstücher (60 St)', 'hpn':'54.99.02.0015', 'me':60},
	{'bez':'Packung Cleanisept Flächendesinfektionstücher (100 St)', 'hpn':'54.99.02.0015', 'me':100}
];

const pflegehimi51 = [
	{'bez':'Bettschutzeinlagen wiederverwendbar', 'hpn':'51.40.01.4', 'ep':22.0, 'q':'St', 'f':1}
];

const pg54max = 42.0;
const mwst = 0.19;

function activateBox(boxname, header, force_refresh) {
	
	console.log('Aktiviere Box '+boxname);
	
	$('.databox').hide();
	var box = $('#'+boxname);
	var refresh = false;
	
	if(typeof force_refresh != 'undefined' && force_refresh === true) {
		box.remove();
		refresh = true;		
	}
		
	if(refresh || !box.length) {
		box = $('<div>', {'id':boxname, 'class':'databox'}).appendTo('#mainbox');
		if(typeof header == 'string') {
			$('<h2>').appendTo(box).append(header);
		}
		//box.hide();
		return box;
	}
	
	box.show();
	return false;
}

let debugbox_counter = 0;

function debug2box(v, h, box) {
	if(!debug_mode) { return; }
		
	if(typeof h != 'undefined') {
		h = h + ' (' + (typeof v) + ')';
	} else {
		h = typeof v;		
	}
	
	let contentbox = box;
	
	++debugbox_counter;
	
	if(typeof box != 'object') {
		box = $('<div>', {'id':'debugbox_'+debugbox_counter,'class':'debugbox card'}).appendTo('#debugbox');
		let boxheader = $('<div>',{'class':'card-header'}).appendTo(box);
		$('<h2>',{'class':'debug_title', 'data-toggle':'collapse', 'data-target':'#debugcontent_'+debugbox_counter,'aria-expanded':'false','aria-controls':'debugcontent_'+debugbox_counter}).appendTo(boxheader).append(h);
		contentbox = $('<div>', {'id':'debugcontent_'+debugbox_counter,'class':'debug_content card-body collapse'}).appendTo(box);
		/* box.click(function() { contentbox.toggle(); }); */
	} 
	
	if(typeof v == 'object') {
		var ul = $('<ul>').appendTo(contentbox);
		var li;
		
		if(Array.isArray(v)) {
			for(var i = 0; i < v.length; ++i) {
				li = $('<li>').appendTo(ul).append('<b>'+i+':</b> ');
				debug2box(v[i], h, li);
			}
		} else {
			for(var e in v) {
				li = $('<li>').appendTo(ul).append('<b>'+e+':</b> ');
				debug2box(v[e], h, li);
			}
			//box.append("<tt><pre>" + JSON.stringify(v)+"</pre></tt><br />");
		}
	} else {
		//box.append("<tt><pre>" + JSON.stringify(v)+"</pre></tt><br />");
		contentbox.append(JSON.stringify(v) + ' (' + (typeof v) + ')');
	}
	
	//$('#debugbox').append("<h2>"+h+ "</h2><tt><pre>" + JSON.stringify(v)+"</pre></tt><br />");
}

function spinner(id) {
	if(typeof id == 'undefined') {
		id = 'main-spinner';
	}
	return $('<div>', {'class':'spinner-border', 'id':id, 'role':'status'}).append($('<span>', {'class':'sr-only'}).append('Loading...'));
}

function getAjax(params) {
	
	if(typeof params != 'object') {
		p = {};
	}
	
	var dfd = $.Deferred();
	
	var getAjaxData = function(p) {
		if(typeof p == 'undefined') {
			p = {};
		}	
		$.ajax({
			'url': ajax_url,
			'method': 'POST',
            'data': p,
			'headers': {
						'cache-control': 'no-cache',
			}
		}).done(function (resultdata) {
			if(typeof resultdata.error != 'undefined') {
				console.log(resultdata.error);
				dfd.resolve(false);
			}
			dfd.resolve(resultdata);
		});	
	};
	
	getAjaxData(params);
	
	return dfd.promise();
}

function setAmount(id, a) {
	if(isNaN(a)) { a = 0; }
	if(a > 0) {
		$(id).data('amount', a).val(a.toFixed(2).replace('.',','));
	} else {
		$(id).data('amount', 0).val('');
	}
}

function getAmount(id) {	
	let a = $(id).data('amount');
	if(isNaN(a)) { return 0; }
	return a;
}

function sumupall() {
	let eigen54 = getAmount('#input_eigen54');	
	let ges = getAmount('#input_summe54');
	let pg51 = getAmount('#hpn_5140014_preis');
	let zuz = 0;
	let beih = 0;
	
	if(getCheck('#check_beihilfe')) {
		zuz = Math.floor(pg51 / 2.0 * 100.0) / 100.0;
		beih = Math.ceil((ges - eigen54)/2.0 * 100.0) / 100.0;
		beih += Math.ceil(pg51 / 2.0 * 100.0) / 100.0;
	}
	
	if(getCheck('#check_zuzahlung_pg54')) {
		console.log('Zuzahlung: JA');
		zuz = Math.round(pg51 * 10.0) / 100.0;
	} else {
		zuz = 0;
	}
	
	let p = eigen54 + zuz + beih;
	let k = ges - eigen54 + pg51 - zuz - beih;  /* TODO PG 51 */
	
	setAmount('#input_zuzahlung', zuz);
	setAmount('#input_beihilfe', beih);
	setAmount('#input_kasse', k);
	setAmount('#input_patient', p);		
}

function getCheck(id) {
	return $(id).prop('checked');
}

function sumup54() {
	var sum = 0;
	
	for(let i in pflegehimi54) {
		let himi = pflegehimi54[i];
		hpnid = 'hpn_'+himi['hpn'].replaceAll('.','');
		sum += $('#'+hpnid+'_preis').data('amount');
	}
	
	setAmount('#input_summe54', sum);		

	var diff = sum - pg54max;
	
	if(diff > 0) {
		$('#eigen_warning_btn').show();
	} else {
		$('#eigen_warning_btn').hide();
	}
	
	setAmount('#input_eigen54', diff);
	
	sumupall();
	
	/*
	$.when(
		$('input.input_preis_54').each(function(i, obj) {
				sum += $(obj).data('amount');
				console.log('Lfd. Summe: '+sum);
		})
		
	).then(function() {
		$('#input_summe54').val(String(sum).replace('.',','));
		console.log('PG54 Summe: '+sum);
		var diff = sum - pg54max;
			if(diff > 0) {
				$('#input_eigen54').val(String(diff).replace('.',','));
			} else {
				$('#input_eigen54').val('');
			}
	});
	*/

}

function quickadd(hpnid, me) {
	console.log(hpnid+' plus '+me);
	let e = $('#'+hpnid+'_menge');
	if(e.length) {
		let v = parseInt(e.val());
		if(isNaN(v)) { v = 0 };
		let vv = v + me;
		if(vv < 1) { vv = ''; }
		e.val(vv);
		recalc(e, hpnid, '54');
	}
}

function showquickies(out) {
	var list = $('<ul>').appendTo(out);
	
	for(let i in quickies) {
		let himi = quickies[i];
		let me = himi['me'];
		let hpnid = 'hpn_'+himi['hpn'].replaceAll('.','');
		let li = $('<li>').appendTo(list);
		
		$('<button>', {'type':'button','class':'btn btn-primary btn-sm d-print-none quickie_btn'}).append('+1').appendTo(li).on('click', function() { quickadd(hpnid, me); } );
		$('<span>',{'class':'quickies_bez'}).appendTo(li).append(himi['bez']);
		$('<button>', {'type':'button','class':'btn btn-danger btn-sm d-print-none quickie_btn'}).append('-1').appendTo(li).on('click', function() { quickadd(hpnid, (0-me)); } );
	}
}

function recalc(obj, group) {
	
	let o = $(obj);
	
	let hpnid = o.data('hpnid');
		
	let val = o.val();
	let intval = parseInt(val);
	if(String(intval) != val) {
		if(val.trim() != '') {
			alert('Nur ganzzahlige Eingaben zulässig!');
		}
		if(isNaN(intval)) {
			intval = 0;
			o.val('');
		} else {
			o.val(intval);
		}					
	}
	
	let netto = $(obj).data('ep') * intval;
	
	let tax = Math.round(netto * mwst * 100.0)/100.0;
	let brutto = netto + tax;
	
	setAmount('#'+hpnid+'_preis',brutto);
	if(group = '54') {
		sumup54();
	} else {
		sumupall();
	}
}

function himi_inputform(data, out) {

	for(let i in data) {
		let himi = data[i];
		tr = $('<tr>').appendTo(out);		
		hpnid = 'hpn_'+himi['hpn'].replaceAll('.','');
		
		let arr = himi['hpn'].split('.');
		let group = arr[0];
		
		$('<td>',{'class':'anlage3 anlage3_col anlage3_bez'}).appendTo(tr).append(himi['bez']);
		$('<td>',{'class':'anlage3 anlage3_col anlage3_hpn'}).appendTo(tr).append(himi['hpn']);
		
		let me = $('<td>',{'class':'anlage3 anlage3_col anlage3_menge'}).appendTo(tr);
		let inp_me = input(me, 'input_menge input_menge_'+group, hpnid+'_menge');
		inp_me.data('hpn',himi['hpn']);
		inp_me.data('hpnid',hpnid);
		inp_me.data('quantity',himi['q']);
		inp_me.data('factor',himi['f']);
		inp_me.data('ep',himi['ep']);
		inp_me.on('change', function() {
			recalc(inp_me, group);
		});		
		let t = '&nbsp;';
		if(himi['f'] > 1) {
			t += 'x'+himi['f']+'&nbsp;';
		}
		t += himi['q'];
		$('<span>', {'class':'anlage3_quantity d-print-none'}).appendTo(me).append(t);
		
		eur( 
			$('<td>',{'class':'anlage3 anlage3_col anlage3_preis'}).appendTo(tr).append(
				input(null,'input_betrag input_preis_'+group,hpnid+'_preis', 10, true).data('amount',0)
			)
		);
	}
}

function eur(target) {
	let e = $('<span>', {'class':'anlage3_currency d-print-none'}).append('&nbsp;&euro;');
	if(typeof target == 'object') {
		e.appendTo(target);
	}
	return e;
}

function input(target, css, id, size, readonly) {
	
	let a = {'type':'text', 'size':'10'}
	
	if(typeof css == 'string') {
		a['class'] = css;
	}
	
	if(typeof id == 'string') {
		a['id'] = id;
	}
	
	if(typeof size == 'number') {
		a['size'] = size;
	}
	
	if(readonly == true) {
		a['readonly'] = 'readonly';
	}

	let e = $('<input>', a);
	
	if(typeof target == 'object') {
		e.appendTo(target);
	}
	
	return e;
}

function check(target, css, id, value, label, ischecked) {
	
	let a = {'type':'checkbox'}
	
	if(typeof ischecked != 'boolean') {
		ischecked = false;
	}
	
	if(ischecked) {
		a['checked'] = 'checked';
	}
	
	if(typeof css == 'string') {
		a['class'] = css;
	}
	
	if(typeof id == 'string') {
		a['id'] = id;
	}
	
	if(typeof value == 'string') {
		a['value'] = value;
	}
	
	let d = $('<div>', {'class':'labelwrapper'}); 
	let e = $('<input>', a).appendTo(d);
	
	if(typeof id == 'string' && typeof label == 'string') {
		$('<label>', {'for':id}).append(label).appendTo(d);
	}	
			
	if(typeof target == 'object') {
		d.appendTo(target);
	}
		
	return d;
}


function create_pg54(patient_id) {
	
	if(typeof patient_id == 'undefined') {
		console.log('patient_id is undefined!!');
		return false;
	}
	
	var box = activateBox('pflegehimi_pg54', 'Empfangsbestätigung PflegeHiMi', true);
	
	$('h2', box).addClass('d-print-none');
	
	let p = {'patient':patient_id};
	
	console.log('Erzeuge PG54 für Patient ID '+patient_id);
	
	getAjax(p).done(function (r) {
			
		if(typeof r['error'] == 'string') {
			 $('<p>', {'class':'text-warning'}).append(r['error']).appendTo(output);
			 return;
		}
		
		console.log(r['found'] + ' Datensätze gefunden');
				
		if(r['found'] < 1 ) {
			$('<p>', {'class':'text-info'}).append('Kein Daten zu Patient ID '+patient_id+'!!').appendTo(box);
			return;
		}
		
		$('#mainbox').addClass('flex-containter').removeClass('container');
		box.addClass('flex-containter');
		/*
		let row = $('<div>', {'class':'row'}).appendTo(box);
		let col1 = $('<div>', {'class':'col-6 maincol'}).appendTo(row);
		let col2 = $('<div>', {'class':'col sidecol'}).appendTo(row);
		*/
		
		let sidecol = $('<div>', {'class':'sidecol'}).appendTo(box);
		let maincol = $('<div>', {'class':'maincol'}).appendTo(box);
				
		var button_bar = $('<div>', {'class':'fixed-top button-bar d-print-none', 'id':'button_bar'}).appendTo(box);
		$('<button>', {'type':'button','class':'btn btn-primary float-right d-print-none', 'id':'print_btn'}).append('Drucken').appendTo(button_bar).on('click', function() { window.print(); });
		$('<button>', {'type':'button','class':'btn btn-danger float-right d-print-none', 'id':'eigen_warning_btn'}).append('Erstattungsbetrag überschritten, Patient zahlt Eigenanteil!').appendTo(button_bar).hide();
		
		showquickies($('<div>', {'class':'float-right quickies-box d-print-none', 'id':'quickies_box'}).appendTo(sidecol));
		
		apo = r['apo'];

		var h = r['hitlist'];
		var pat = h[0];
	/*
		var out = $('<ul>').appendTo(box);
		for(let item in pat) {
			$('<li>').appendTo(out).append(item+': '+pat[item]);
		}
	*/	
		const date = new Date();
		const printonly = {'class':'d-none d-print-table-row'};
		
		var anlage = $('<table>', {'class':'anlage3'}).appendTo(maincol);
		
		var tr = $('<tr>', printonly).appendTo(anlage);
		$('<th>',{'class':'anlage3 anlage3_title','colspan':'3'}).appendTo(tr).append('Anlage 3 - Erklärung zum Erhalt von Pflegehilfsmitteln (Empfangsbestätigung');
		$('<th>',{'class':'anlage3 anlage3_act anlage3_col4'}).appendTo(tr).append('AC/TK: 11/00/P53');
		
		tr = $('<tr>', printonly).appendTo(anlage);
		$('<th>',{'class':'anlage3 anlage3_subtitle','colspan':'4'}).appendTo(tr).append('- Zum Verbleib in der Apotheke -');
		
		tr = $('<tr>').appendTo(anlage);
		$('<td>',{'class':'anlage3 anlage3_data','colspan':'2'}).appendTo(tr).append(pat['pk_ik'] + ' '+ pat['pk_name']);
		$('<td>',{'class':'anlage3 anlage3_data'}).appendTo(tr).append(pat['vsnr']);
		$('<td>',{'class':'anlage3 anlage3_data anlage3_vsdate anlage3_col4'}).appendTo(tr).append((date.getMonth() < 9 ? '0':'')+(date.getMonth()+1)+'/'+date.getFullYear());
		
		tr = $('<tr>', printonly).appendTo(anlage);
		$('<td>',{'class':'anlage3 anlage3_label','colspan':'2'}).appendTo(tr).append('IK und Name der Pflegekasse');
		$('<td>',{'class':'anlage3 anlage3_label'}).appendTo(tr).append('Versichertennummer');
		$('<td>',{'class':'anlage3 anlage3_label anlage3_col4'}).appendTo(tr).append('Versorgungsmonat');
		
		tr = $('<tr>').appendTo(anlage);
		$('<td>',{'class':'anlage3 anlage3_data','colspan':'3'}).appendTo(tr).append(pat['name'] + ', '+ pat['vorname']);
		$('<td>',{'class':'anlage3 anlage3_data anlage3_col4'}).appendTo(tr).append(pat['geb']);
		
		tr = $('<tr>', printonly).appendTo(anlage);
		$('<td>',{'class':'anlage3 anlage3_label','colspan':'3'}).appendTo(tr).append('Name des Versicherten, ggf. eines Ansprechpartners');
		$('<td>',{'class':'anlage3 anlage3_label anlage3_col4'}).appendTo(tr).append('Geburtsdatum');
					
		tr = $('<tr>').appendTo(anlage);
		$('<td>',{'class':'anlage3 anlage3_data','colspan':'3'}).appendTo(tr).append(pat['adresse'] + ', '+ pat['plz'] + ' '+ pat['ort']);
		$('<td>',{'class':'anlage3 anlage3_data anlage3_col4'}).appendTo(tr).append(pat['gen_pg54']);
		
		tr = $('<tr>', printonly).appendTo(anlage);
		$('<td>',{'class':'anlage3 anlage3_label','colspan':'3'}).appendTo(tr).append('Anschrift des Versicherten, ggf. eines Ansprechpartners');
		$('<td>',{'class':'anlage3 anlage3_label anlage3_col4'}).appendTo(tr).append('Genehmigungskennzeichen');
				
		tr = $('<tr>', printonly).appendTo(anlage);
		$('<td>',{'class':'anlage3 anlage3_data','colspan':'4'}).appendTo(tr).append(apo['ik'] + ' ' + apo['name'] + ', ' + apo['adresse'] + ', ' + apo['plz'] + ' ' + apo['ort']);
		
		tr = $('<tr>', printonly).appendTo(anlage);
		$('<td>',{'class':'anlage3 anlage3_label','colspan':'4'}).appendTo(tr).append('IK, Name und Adresse der Apotheke');
		
		tr = $('<tr>', printonly).appendTo(anlage);
		$('<td>',{'class':'anlage3 anlage3_p','colspan':'4'}).appendTo(tr).append('Die zuvor genannte Apotheke hat mir heute im augenscheinlich hygienischen und einwandfreien Zustand nachfolgend aufgeführte Pflegehilfsmittel übergeben sowie mich – soweit erforderlich – in den Gebrauch des Pflegehilfsmittels eingewiesen.');
		
		tr = $('<tr>').appendTo(anlage);
		$('<th>',{'class':'anlage3 anlage3_col'}).appendTo(tr).append('Bezeichnung');
		$('<th>',{'class':'anlage3 anlage3_col'}).appendTo(tr).append('Pflegehilfsmittel-<br/>positionsnummer');
		$('<th>',{'class':'anlage3 anlage3_col'}).appendTo(tr).append('Menge<br/>St/100ml');
		$('<th>',{'class':'anlage3 anlage3_col'}).appendTo(tr).append('Gesamtpreis<br/>mit MwSt. in €');
		
		
		himi_inputform(pflegehimi54, anlage);
				
		tr = $('<tr>').appendTo(anlage);
		$('<td>',{'class':'anlage3 anlage3_spacer','colspan':'4'}).appendTo(tr).append('&nbsp;');
		
		tr = $('<tr>').appendTo(anlage);
		$('<td>',{'class':'anlage3 anlage3_sum anlage3_sum_summe54','colspan':'3'}).appendTo(tr).append('Gesamtsumme PG 54');
		eur( $('<td>',{'class':'anlage3 anlage3_sum anlage3_sum_summe54'}).appendTo(tr).append(input(null,'input_betrag input_summe54','input_summe54', 10, true)) );
		
		tr = $('<tr>').appendTo(anlage);
		$('<td>',{'class':'anlage3 anlage3_sum anlage3_sum_eigen54','colspan':'3'}).appendTo(tr).append('Eigenbeteiligung PG 54');
		eur($('<td>',{'class':'anlage3 anlage3_sum anlage3_sum_eigen54'}).appendTo(tr).append(input(null,'input_betrag input_eigen54','input_eigen54', 10, true)) );
				
		tr = $('<tr>').appendTo(anlage);
		$('<td>',{'class':'anlage3 anlage3_spacer','colspan':'4'}).appendTo(tr).append('&nbsp;');
		
		himi_inputform(pflegehimi51, anlage);
	
		tr = $('<tr>').appendTo(anlage);
		$('<td>',{'class':'anlage3 anlage3_check','colspan':'3'}).appendTo(tr).append( check(null, 'anlage3_check', 'check_zuzahlung_pg54', '1', 'Zuzahlung PG 51', true).on('change', function() { console.log('Änderung Zuzahlung'); sumupall(); } ));
		eur( $('<td>',{'class':'anlage3 anlage3_sum'}).appendTo(tr).append( input(null,'input_betrag input_zuzahlung','input_zuzahlung', 10, true)) );
		
		tr = $('<tr>').appendTo(anlage);
		$('<td>',{'class':'anlage3 anlage3_check','colspan':'3'}).appendTo(tr).append( check(null, 'anlage3_check', 'check_beihilfe', '1', 'Beihilfe').on('change', function() { console.log('Änderung Beihilfe'); sumupall(); } ));
		eur( $('<td>',{'class':'anlage3 anlage3_sum'}).appendTo(tr).append( input(null,'input_betrag input_beihilfe','input_beihilfe', 10, true)) );
		
		tr = $('<tr>').appendTo(anlage);
		$('<th>',{'class':'anlage3 anlage3_total anlage3_total_patient','colspan':'3'}).appendTo(tr).append('Zahlbetrag Patient');
		eur( $('<td>',{'class':'anlage3 anlage3_sum anlage3_sum_patient'}).appendTo(tr).append(input(null,'input_betrag input_patient','input_patient', 10, true)) );
		
		tr = $('<tr>').appendTo(anlage);
		$('<th>',{'class':'anlage3 anlage3_total anlage3_total_kasse','colspan':'3'}).appendTo(tr).append('Zahlbetrag Kasse');
		eur( $('<td>',{'class':'anlage3 anlage3_sum anlage3_sum_kasse'}).appendTo(tr).append(input(null,'input_betrag input_kasse','input_kasse', 10, true)) );
		
		tr = $('<tr>', printonly).appendTo(anlage);
		$('<td>',{'class':'anlage3 anlage3_p','colspan':'4'}).appendTo(tr).append('Ich darf die überlassenen Pflegehilfsmittel keinem Dritten verleihen, übereignen oder verpfänden. Ich bin darüber aufgeklärt worden, dass die Pflegekasse die Kosten nur für solche Pflegehilfsmittel und in dem finanziellen Umfang übernimmt, für die ich eine Kostenübernahmeerklärung durch die Pflegekasse erhalten habe. Kosten für evtl. darüberhinausgehende Leistungen sind von mir selbst zu tragen. Eine Durchschrift dieser Erklärung habe ich erhalten. Weiterhin bin ich darauf hingewiesen worden, dass ich die erhaltenen Produkte ausnahmslos für die häusliche Pflege durch eine private Pflegeperson (und nicht durch Pflegedienste oder Einrichtungen der Tagespflege) verwenden darf.');
		
		tr = $('<tr>', printonly).appendTo(anlage);
		$('<td>',{'class':'anlage3 anlage3_sign anlage3_sign_datum'}).appendTo(tr).append((date.getDate() > 9 ? '':'0')+date.getDate()+'.'+(date.getMonth() < 9 ? '0':'')+(date.getMonth()+1)+'.'+date.getFullYear());
		$('<td>',{'class':'anlage3 anlage3_sign','colspan':'3'}).appendTo(tr).append('&nbsp;');
		
		tr = $('<tr>', printonly).appendTo(anlage);
		$('<td>',{'class':'anlage3 anlage3_signlabel','colspan':'4'}).appendTo(tr).append('Datum und Unterschrift der/des Versicherten*');
		
		tr = $('<tr>', printonly).appendTo(anlage);
		$('<td>',{'class':'anlage3 anlage3_footnote','colspan':'4'}).appendTo(tr).append('*Unterschrift der Betreuungsperson oder des gesetzlichen Vertreters bei Personen, die das 18. Lebensjahr noch nicht vollendet haben');
	});	
}


function patientensuche(output) {

	let suchstring = $('#searchInput').val();
	let deadcheck = $('#deadCheck').prop('checked')

	let p = {'patientensuche':suchstring};
	
	if(deadcheck == true) {
		p['includedead'] = '1';
	}

	if(suchstring.length < min_search_length) {
		$(output).empty();
		$('<p>', {'class':'text-warning'}).append('Suchanfrage ist zu kurz!').appendTo(output);
		console.log('Suchestring '+suchstring+' ist zu kurz. (Min. '+min_search_length+' Zeichen)');
		return;
	}

	/* $(output).append(spinner());*/
		
	console.log('Starte Suche nach '+suchstring);
	
	getAjax(p).done(function (r) {
			$(output).empty();
			if(typeof r['error'] == 'string') {
				 $('<p>', {'class':'text-warning'}).append(r['error']).appendTo(output);
				 return;
			}		
			if(r['found'] > 0 ) {
				$('<p>', {'class':'text-info'}).append(r['found']+' Treffer:').appendTo(output);
				
				var cols = {'name':'Name', 'vorname':'Vorname', 'geb':'Geb.Dat.', 'pk_ik':'IK', 'pk_name':'Pflegekasse'};
				var h = r['hitlist'];
				generateTable(h, cols, {'table_id':'suchtreffertabelle'}).appendTo(output);
				return;
			} else {
				$('<p>', {'class':'text-info'}).append('Kein Treffer zu dieser Suche!').appendTo(output);
				return;
			}		
	});	
}


function isArray(value) {
  return Array.isArray(value);
}

function generateTable(hitlist, column_map, params) {
	 //generateTable(hitlist, column_map, table_id, simpletable, price_cols, bool_cols, table_class, thead_class)
	
	//debug2box(hitlist);
	
	console.log('Params '+params+' ('+(typeof params)+')');
	debug2box(hitlist);
	
	var table_attr = {};
	
	if(typeof hitlist != 'object') {
		return $('<p>', {'class':'text-danger'}).append('Keine Trefferliste!! Sondern: '+(typeof hitlist));
	}
	
	if(typeof column_map != 'object') {
		return $('<p>', {'class':'text-danger'}).append('FEHLER bei der Column Map!');
	}
	
	let bool_cols = params['bool_cols'];
	
	if(typeof params == 'object' && !isArray(bool_cols)) {
		bool_cols = [];
	}
	
	//console.log('bool_cols '+params['bool_cols']+' ('+(typeof params['bool_cols'])+')');
	
	if(typeof params == 'object' && typeof params['table_id'] == 'string') {
		table_attr['id'] = params['table_id'];
	}                                        
	                                        
	//console.log('Simpletable '+simpletable+'prices_mode[c]prices_mode[c] ('+(typeof simpletable)+')');
	
	let simpletable = false;
	
	if(typeof params == 'object' && typeof params['simpletable'] == 'boolean') {
		simpletable = params['simpletable'];
	}
	
	table_attr['class'] = 'table table-hover trefferliste';
		
	if(typeof params == 'object' && typeof params['table_class'] == 'string') {
		table_attr['class'] = params['table_class'];
	} 
	
	let thead_class = 'thead-light';
	
	if(typeof params == 'object' && typeof params['thead_class'] == 'string') {
		thead_class = params['thead_class'];
	}
	
//	console.log('Wir erzeugen jetzt eine Tabelle mit '+hitlist.length+' Zeilen');

	const today = moment();
	
	var table = $('<table>', table_attr);
	var thead = $('<thead>', {'class':thead_class}).appendTo(table);
	var tr = $('<tr>').appendTo(thead);
	var tbody = $('<tbody>').appendTo(table);
	
	var cspan = Object.keys(column_map).length + 1;
	
	if(!simpletable) {
		$('<th>').appendTo(tr);
	}	
				
	for(let c in column_map) {
		$('<th>').appendTo(tr).append(column_map[c]);
	}
		
	for(let row in hitlist) {
		let item = hitlist[row];
		let row_id = 'patient_' + item['id'];
		
		if(simpletable) {
			tr = $('<tr>').appendTo(tbody);
		} else {
			//tr = $('<tr>', {'class':'accordion-toggle'}).attr('data-toggle','collapse').attr('data-target','#'+row_id).appendTo(tbody);
			tr = $('<tr>').appendTo(tbody);
			let td = $('<td>').appendTo(tr);
			let valid = false;
			
			if(item['pg54_start'] != null) {				
				start = moment(item['pg54_start']);
				if(start.isBefore(today)) {
					valid = true;
					console.log('Startdatum '+item['pg54_start']+' ist in der Vergangenheit');
				} else {
					valid = false;
					console.log('Startdatum '+item['pg54_start']+' liegt in der Zukunft!!');
				}				
			} else {
				console.log('Kein Startdatum vorhanden!!');
			}
			
			if(item['pg54_ende'] != null) {
				ende = moment(item['pg54_ende']);
				if(today.isAfter(ende)) {
					valid = false;
					console.log('Enddatum '+item['pg54_ende']+' ist in der Vergangenheit!!');
				} else {
					valid = true;
					console.log('Enddatum '+item['pg54_ende']+' liegt in der Zukunft');
				}
			} else {
				console.log('Kein Enddatum vorhanden');
			}
			
			if(item['verstorben'] > 0) {
				/*Verstorben!!*/
			} else if(valid) {
				let btn = $('<button>', {'type':'button', 'class':'btn btn-default btn-xs'}).appendTo(td).on("click",function() { 
					create_pg54(item['id']);
				});
				$('<span>', {'class':'plus-button'}).appendTo(btn);
			} else {
				$('<span>', {'class':'invalid'}).appendTo(td).append('--');
			}
		}
		
		for(let c in column_map) {
			if(item[c] == null) continue;
			let cnum = Number.parseFloat(item[c]);
			let cc = null;
			let cval = item[c].toString();

			if(bool_cols.includes(c)) {
				if(cnum == 0) {
					cval = 'Nein';
					cc = {'class':'is_nein'};
				} else {
					cval = 'Ja';
					cc = {'class':'is_ja'};
				}
			}
			
			if(item['verstorben'] > 0) {
				cc = {'class':'is_dead'};
			}

			$('<td>', cc).appendTo(tr).append(cval);
		}

		if(!simpletable) {
/*
			tr = $('<tr>').appendTo(tbody);
			let td = $('<td>', {'colspan':cspan,'class':'hiddenRow'}).appendTo(tr);
			let dv = $('<div>', {'id':row_id,'class':'accordian-body collapse moreinfo border border-dark'}).appendTo(td).on('show.bs.collapse', function () {
				var rdiv = $('#'+row_id);
				if($('#'+row_id+'_tab').length) {
					console.log('Moreinfo-Tabelle '+row_id+' existiert schon. Brauchen wir nicht nochmal laden.');
					return;
				}
				$(rdiv).empty().append(spinner());
				var pp = {'artikeldetails':item['artikel_id']};
				getAjax(pp).done(function (rr) {
					$(rdiv).empty();
					if(rr['found'] > 0 ) {
						var cl = {'name':'Standort', 'eek':'EEK', 'evk':'EVK', 'avk':'AVK', 're_ek':'RE (EK)', 're_ek_rel':'Aufschlag (EK)', 're_eek':'RE (EEK)', 're_eek_rel':'Aufschlag (EEK)', 'kalkulationsmodell':'Kalkulationsmodell'}; 
						var hh = rr['hitlist'];
						//generateTable(hh, cl, row_id+'_tab', true, ['eek', 'evk', 'avk', 're_ek', 're_eek'], [], 'table table-bordered table-sm table-hover subliste').appendTo(rdiv);
						generateTable(hh, cl, {'table_id':row_id+'_tab', 'simpletable':true, 'mode_cols':['eek', 'evk', 'avk'], 'price_cols':['eek', 'evk', 'avk', 're_ek', 're_eek'], 'rel_cols':['re_ek_rel', 're_eek_rel'], 'table_class':'table table-bordered table-sm table-hover subliste'}).appendTo(rdiv);	

					}
				});
				
			});
			*/
		}
		
	}
	
	table.tablesorter();
	
	//console.log('Und jetzt übergeben wir die Tabelle');
	
	return table;
}


$(document).ready(function() {
	var main_nav = $('#mainNavbar > ul');
	
	$('<a>', {'class':'nav-link','href':"#"}).appendTo($('<li>', {'class':'nav-item'}).appendTo(main_nav)).append('Patientensuche').on('click', function(){
			activateBox('pflegehimi_main', 'Pflegehilfsmittel');
	});
	
	$('<div>',{'id':'debugbox','class':'container','role':'note'}).insertAfter('#mainbox');
	
	var mainbox = activateBox('pflegehimi_main', 'Pflegehilfsmittel');
	
	$(mainbox).append(spinner());
	
	getAjax().done(function (r) {

		let count_patienten = r['hitlist'][0]['count_patienten'];
		
		apo = r['apo'];
				
		var suche = $('<div>', {'class':'container my-2','id':'c_suche'}).appendTo(mainbox);
		var ergebnis = $('<div>', {'class':'container my-2','id':'c_ergebnis'}).appendTo(mainbox);
		var sf  = $('<form>').appendTo(suche);
		let sfd = $('<div>', {'class':'form-group'}).appendTo(sf);
		
		$('<label>', {'for':'searchInput'}).appendTo(sfd).append('Patientensuche');
		$('<input>', {'type':'text', 'class':'form-control', 'id':'searchInput', 'aria-describedby':'searchHelp'}).appendTo(sfd).on('input', function(){ 

				if(searchStartTimeout != null) clearTimeout(searchStartTimeout);  
				searchStartTimeout = setTimeout(function() { patientensuche(ergebnis); }, searchStartDelay);   
				console.log('Verzögere Suche um '+searchStartDelay+' ms.');

		});
		
		sfd = $('<div>', {'class':'form-group form-check'}).appendTo(sf);
		$('<input>', {'type':'checkbox', 'class':'form-check-input', 'id':'deadCheck'}).appendTo(sfd).on('change', function(){ patientensuche(ergebnis); });		
		$('<label>', {'for':'deadCheck', 'class':'form-check-label'}).appendTo(sfd).append('Auch verstorbene Patienten anzeigen');
		
			var info = $('<div>', {'class':'container mt-4','id':'c_info'}).appendTo(mainbox);
		$('<p>').appendTo(info).append('Es sind '+count_patienten+' Patienten vorhanden.');
		
    	$('#main-spinner').remove();			
	});

});