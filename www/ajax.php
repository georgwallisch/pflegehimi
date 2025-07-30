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

try {
	
	ob_start();
	
	require_once '../config.php';
	/*
	$search  = array('*', '?', ' ');
	$replace = array('%', '_', '%');
	*/
	
	$search  = array('*', '?');
	$replace = array('%', '_');
	// */
	
	$reply = array();
	
	$st = null;
	
	//$q = 'SELECT patienten.*, DATE_FORMAT(geb,\''.$db_date_format.'\') AS geb, pflegekasse.ik as pk_ik, pflegekasse.name as pk_name FROM patienten, pflegekasse LEFT JOIN gen_pg54 ON gen_pg54.patient_id=patienten.id WHERE patienten.pflegekasse_id=pflegekasse.id AND LOWER (patienten.name) LIKE \''.$ss."'"
	$q = 'SELECT p.*, DATE_FORMAT(p.geb,\''.$db_date_format.'\') AS geb, DATE_FORMAT(p.sterbedatum,\''.$db_date_format.'\') AS sterbedatum, '; 
	$q .= 'k.ik AS pk_ik, k.name AS pk_name, ';
	//$q .= 'g.kz AS gen_pg54, DATE_FORMAT(g.start,\''.$db_date_format.'\') AS pg54_start, DATE_FORMAT(g.end,\''.$db_date_format.'\') AS pg54_ende ';
	$q .= 'g.kz AS gen_pg54, g.start AS pg54_start, g.end AS pg54_ende ';
	$q .= 'FROM `patienten` AS p ';
	$q .= 'LEFT JOIN pflegekasse AS k ON p.pflegekasse_id=k.id ';
	$q .= 'LEFT JOIN gen_pg54 AS g ON g.patient_id=p.id ';
	
	$o = ' ORDER BY p.name, p.vorname, p.vsnr';

	if(!is_null($s = trim(get_value('patientensuche'))) and strlen($s) > 0) {
		
		$ss = str_replace($search, $replace, strtolower($s));
		$sa = explode(' ',$ss);
			
		$b = '';
		$q .= 'WHERE ';
		$c = array();
		$d = array();
		for($i = 0; $i < count($sa); ++$i) {
			$c[] = '(LOWER (p.name) LIKE ? OR LOWER (p.vorname) LIKE ?)';
			$d[] = $sa[$i].'%';
			$d[] = $sa[$i].'%'; // !!
			$b .= 'ss';
		}
		$q .= implode(' AND ', $c);
		if(is_null(get_value('includedead'))) {
			$q .= ' AND (p.verstorben <> 1 OR p.verstorben IS NULL)';
		}
		$q .= $o;
		$st = $db->prepare($q);
		$st->bind_param($b, ...$d);
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
			$q .= $o;
			$st = $db->prepare($q);
			$reply['search_type'] = 'patientenliste';
		}	
	
	} else {
		$q = 'SELECT COUNT(*) AS count_patienten FROM patienten';
		$st = $db->prepare($q);
		$reply['search_type'] = 'info';
	}
	
	if($st === false) {
		send_reply(array('error' => 'MySQL Syntax Error', 'MySQL Error Details' => $db->error));
		
	} elseif (!is_null($st)) {
		if($debugmode) {
			$reply['query'] = $q;
			$reply['searchstring'] = $ss;
			$reply['params'] = $d;
		}
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
} catch (Exception $e) {
	ob_end_clean();
	header("Content-type: text/plain; charset=utf-8");
	echo "mysqli-Error: ".$e->getMessage();
	echo "\n\nQuery was:\n\n".$q;
	echo "\n\nParam signature was:\n\n".$b;
	echo "\n\nParams were:\n\n";
	print_r($d);
    exit(1);
}

?>