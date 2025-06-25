#!/usr/bin/php
<?php

	require_once('config.php');
	/*
	$st_getid_pflegekasse = $db->prepare('SELECT id FROM pflegekasse WHERE ik=?');
	$st_insert_pflegekasse = $db->prepare('INSERT INTO pflegekasse ('.implode(',',array_keys($pflegekasse_felder)).') VALUES (?'.str_repeat(',?', count($pflegekasse_felder) - 1).')');
	*/
	
	if(VERBOSE) echo "\n*** VERBOSE Mode ***\n";
	
	echo "\n*** PflegeHiMI Import ***\n";
	
	if($argc < 2) {
	
		echo "\nUSAGE: ".$argv[0]." file1.csv [file2.csv] [file3.csv] [..]\n";
		echo "\nfile[n].csv must be located in {$csvdir}\n\n";
		exit(1);	
	}
		
	$files = array();
	
	echo "\nCSV source directory is {$csvdir}\n";
	
	for($i = 1; $i < $argc; $i++) {

		$f = $argv[$i];
		$filepath = $csvdir.'/'.$f;
		
		if(VERBOSE) echo "Opening $f ..\n";
		
		if(is_file($filepath) and is_readable($filepath)) {
			$path_parts = pathinfo($filepath);
			if($path_parts['extension'] != 'csv') {
				if(VERBOSE) echo $f." is not a CSV file!!\n";
				continue;
			}
			$files[] = $filepath;
		} else {
			echo "Cannot access $f or it is not a valid file!\n";
		}
	}

	foreach($files as $filepath) {
	
				$importcounter = 0;
				$newcounter = 0;
				
				$lastupdate = filemtime($filepath);
				echo "Datenstand ist ".date ("d.m.Y H:i", $lastupdate)."\n";
				
				$fp = @fopen($filepath, 'r');
				if($fp === false) {
					echo "\nFehler beim Öffnen von {$filepath}!";
					continue;
				}
				
				/* IMPORT ACTION STARTS HERE */
				
				$firstline = true;
				$csvheader = array();
				$csvbind = array();
	    
				while (($rawdata = fgetcsv($fp, 1000, $csv_separator)) !== FALSE) {
					
					if($firstline === true) {
						$csvheader = mb_convert_encoding($rawdata, $db_encoding, $csv_encoding);
						
						if(VERBOSE) {
							echo "\nCSV-Header:\n\n";
							print_r($csvheader);
							echo "\n";
						}
						
						$firstline = false;
						continue;
					} 
					
					if(++$importcounter % 200 == 0) {
						echo "{$importcounter} Zeilen eingelesen..\n";
					}
					
					$data = array();
										
					foreach($csvheader as $k => $v) {
						$datakey = null;
						$value = $rawdata[$k];
						$dataset = null;
						$bind = null;
						foreach($importfelder as $feldsetkey => $feldset) {
							if(($index = array_search($v, $feldset)) !== false) {
								$datakey = $feldset[$index];
								$dataset = $feldsetkey;
								break;
							}
						}
						
						if(($index = array_search($datakey, $importbind)) !== false) {
								$bind = $importbind[$index];
						}
						
						if(is_null($datakey) or is_null($dataset)) continue;
						
						//$key = $dataset.'_'.$datakey;
						$key = $v;
						
						// Datumsangaben auf Mysql DATE umformatieren
						$value = gwm_convert_date($value);
						
						if($key == 'vsnr') {
							if(!preg_match('/\w\d{9}/', $value)) {
								$value = null;
							}
						}
											
						if($bind == 'd') {
							$data[$key] = str_replace(',','.',$value);
						} elseif($bind == 's') {
							$data[$key] = mb_convert_encoding($value, $db_encoding, $csv_encoding);
						} elseif($bind == 'i') {
							if(in_array($datakey, $bools)) {
									if(substr_compare($value,'ja',0,2,true) == 0) {
										$data[$key] = 1;
									} else {
										$data[$key] = 0;
									}
							} else {
								$data[$key] = $value;
							}
						} else {
							$data[$key] = $value;
						}
						
						
					}
					
					$ik = $data['IK_PK'];
				
					if(VERBOSE) {
							echo "\n";
							print_r($data);
							echo "\n";
						}

	
					if(VERBOSE) echo "pflegekasse_ik: $ik\n";
					
					if($ik > 0) {
					
						$pflegekasse_id = gwm_get_id($db, 'pflegekasse', 'ik', $ik, 'i');
											
						if($pflegekasse_id === false) {
							/* pflegekasse_ik ist noch nicht in der DB => neu anlegen */
							gwm_create($db, 'pflegekasse', gwm_mapdata($data, $pflegekasse_felder), $importbind);
							$pflegekasse_id = gwm_get_id($db, 'pflegekasse', 'ik', $ik, 'i');
						}						
					}
					
					$vsnr = $data['VSNr'];
					
					if(VERBOSE) echo "vsnr: $vsnr\n";
						
					if($vsnr != '') {
						$patient_id = gwm_get_id($db, 'patienten', 'vsnr', $vsnr);
						
						if($patient_id === false) {
							/* patienten_id ist noch nicht in der DB => neu anlegen */
							echo "Patient mit VSNr $vsnr noch nicht in DB vorhanden! Lege neu an..\n";
							gwm_create($db, 'patienten', gwm_mapdata($data, $patienten_felder), $importbind);
							$patient_id = gwm_get_id($db, 'patienten', 'vsnr', $vsnr);
						} else { 
							echo "Patient $patient_id bereits in DB vorhanden!\n";
						}
						
					}
					
					//echo "Setze pflegekasse_id $pflegekasse_id bei Patient $patienten_id\n";
					
					if($patient_id > 0 and $pflegekasse_id > 0) {
						gwm_update_by_id($db, 'patienten', $patient_id, array('pflegekasse_id' => $pflegekasse_id));					
					} 
					
					$pg54 = $data['GenKZ_PG54'];
					
					if($pg54 != '') {
					
						$pg54_id = gwm_get_id($db, 'gen_pg54', 'patient_id', $patient_id);
						
						if($pg54_id === false) {
								/* pg54 ist noch nicht in der DB => neu anlegen */
								gwm_create($db, 'gen_pg54', array('patient_id' => $patient_id, 'kz' => $pg54), array('patient_id' => 'i', 'kz' => 's'));
								$pg54_id = gwm_get_id($db, 'gen_pg54', 'patient_id', $patient_id);
							} 
					}
						
				}
				
				
				fclose($fp);
						
				echo "..fertig: {$importcounter} Zeilen eingelesen und {$newcounter} Datensätze neu eingepflegt!\n";
	
	}
	
?>