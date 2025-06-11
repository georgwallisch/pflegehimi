<?php
	
	$debugmode = get_value('debug', false);
	
	if($debugmode) {
		error_reporting(E_ALL & ~E_NOTICE);
		ini_set("display_errors", 1);
	}

	function get_value($name, $default = null, $isnot = null) {
		if(!array_key_exists($name, $_REQUEST) or $_REQUEST[$name] == $isnot) {
			return $default;
		}
		
		return $_REQUEST[$name];	
	}
	
	function send_reply($arr = null, $die = true) {
		global $reply, $debugmode;
						
		if(is_array($arr)) {
			$reply = array_merge($reply, $arr);
		}
		
		$c = ob_get_contents();
		
		ob_end_clean();
		
		if($debugmode) {
			if(strlen($c) > 0) {
				$reply['ob_content'] = $c;
			}
			header("Content-type: text/plain; charset=utf-8");
			echo "-- DEBUG MODE --\n\n";
			
			echo print_r($_REQUEST);
			echo "\n\n----\n\n";
			echo print_r($reply);
/*		
			echo "\n\n----\n\n";
			global $options, $flatoptions;
			echo print_r($options);
			echo "\n\n----\n\n";
			echo print_r($flatoptions);
			echo "\n\n----\n\n";
*/
		} else {
			header("Content-type: application/json; charset=utf-8");
			echo json_encode($reply);
		}	
		
		if($die) exit;
	}
	
	
	/* main code starts here */


	
	ob_start();
	
	require_once '../config.php';
	
	$search  = array('*', '?', ' ');
	$replace = array('%', '_', '%');
	
	$reply = array();
	
	$st = null;
	
	//$q = 'SELECT patienten.*, DATE_FORMAT(geb,\''.$db_date_format.'\') AS geb, pflegekasse.ik as pk_ik, pflegekasse.name as pk_name FROM patienten, pflegekasse LEFT JOIN gen_pg54 ON gen_pg54.patient_id=patienten.id WHERE patienten.pflegekasse_id=pflegekasse.id AND LOWER (patienten.name) LIKE \''.$ss."'"
	$q = 'SELECT p.*, DATE_FORMAT(p.geb,\''.$db_date_format.'\') AS geb, k.ik AS pk_ik, k.name AS pk_name, g.kz AS gen_pg54 ';
	$q .= 'FROM `patienten` AS p ';
	$q .= 'INNER JOIN pflegekasse AS k ON p.pflegekasse_id=k.id ';
	$q .= 'INNER JOIN gen_pg54 AS g ON g.patient_id=p.id ';
	
	$o = ' ORDER BY p.name, p.vorname, p.vsnr';

	if(!is_null($s = get_value('patientensuche'))) {
		
		$ss = str_replace($search, $replace, strtolower($s)).'%';
		$q .= 'WHERE LOWER (p.name) LIKE ?';
		$st = $db->prepare($q.$o);
		$st->bind_param('s', $ss);
		$reply['search_type'] = 'patient';
	
	} elseif(!is_null($s = get_value('patient'))) {
			
		if($s > 0) {
			//$st = $db->prepare('SELECT patienten.*, DATE_FORMAT(geb,\''.$db_date_format.'\') AS geb, pflegekasse.ik as pk_ik, pflegekasse.name as pk_name FROM patienten, pflegekasse WHERE patienten.pflegekasse_id=pflegekasse.id AND patienten.id=?');
			$q .= 'WHERE p.id=?';
			$st = $db->prepare($q);
			$st->bind_param('i', $s);
			$reply['search_type'] = 'patient';
		} else {
			//$st = $db->prepare('SELECT patienten.*, DATE_FORMAT(geb,\''.$db_date_format.'\') AS geb, pflegekasse.ik as pk_ik, pflegekasse.name as pk_name FROM patienten INNER JOIN pflegekasse ON patienten.pflegekasse_id=pflegekasse.id);
			$st = $db->prepare($q.$o);
			$reply['search_type'] = 'patientenliste';
		}	
	
	} else {
		$st = $db->prepare('SELECT COUNT(*) AS count_patienten FROM patienten');
		$reply['search_type'] = 'info';
	}
	
	if($st === false) {
		send_reply(array('error' => 'MySQL Syntax Error', 'MySQL Error Details' => $db->error));
		
	} elseif (!is_null($st)) {
		
		$reply['search'] = $s;
		$reply['apo'] = $apotheke;
		$st->execute();
		$result = $st->get_result();
		if($result->num_rows < 1) {
			send_reply(array('found' => 0, 'message' => 'Kein Treffer!'));
		} else {
			$reply['found'] = $result->num_rows;
			$hitlist = array();
			while ($row = $result->fetch_assoc()) {
				$hitlist[] = $row;
			}    			
			$reply['hitlist'] = $hitlist;	
		}
		send_reply(null);
	}
	
	ob_end_clean();
?>