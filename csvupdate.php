#!/usr/bin/php
<?php

	require_once('config.php');
	/*
	$st_getid_pflegekasse = $db->prepare('SELECT id FROM pflegekasse WHERE ik=?');
	$st_insert_pflegekasse = $db->prepare('INSERT INTO pflegekasse ('.implode(',',array_keys($pflegekasse_felder)).') VALUES (?'.str_repeat(',?', count($pflegekasse_felder) - 1).')');
	*/
	
	$csv_encoding = 'Windows-1252';
	
	if(VERBOSE) echo "\n*** VERBOSE Mode ***\n";
	
	echo "\n*** PflegeHiMI Update Verstorbene ***\n";
	
	if($argc < 2) {
	
		echo "\nUSAGE: ".$argv[0]." file1.csv\n";
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
					
					if(++$importcounter % 10 == 0) {
						echo "{$importcounter} Zeilen eingelesen..\n";
					}
					
					$data = array();
										
					foreach($csvheader as $k => $v) {
						$value = $rawdata[$k];
						$key = $v;
						 
						$data[$key] = mb_convert_encoding($value, $db_encoding, $csv_encoding); //$value;						
					}
					/*
					if(VERBOSE) {
							echo "\n";
							print_r($data);
							echo "\n";
						}
						*/
					$vsnr = $data['VSNR'];
					$dead = $data['Kunde bis'];
					$name = $data['Nachname'];
					$vorname = $data['Vorname'];
					$geb = $data['Geburtsdatum'];
					
					$s = array('verstorben' => true);
					if(is_string($dead)) {
						$s['sterbedatum'] = gwm_convert_date($dead);
					}
					
					if(is_string($vsnr) and strlen($vsnr) == 10) {
						if(VERBOSE) { echo "\nUpdating VSNr ".$vsnr."\n"; }
						$p = array('vsnr' => $vsnr);
						if($r = gwm_update_by_prop($db, 'patienten', $p, $s, 1)) {
							$newcounter += $r;
						}						
					} elseif(strlen($name) > 1 and strlen($vorname) > 1 and strlen($geb) == 10) {
						if(VERBOSE) { echo "\nUpdating ".$name.', '.$vorname.' ('.$geb.")\n"; }
						$p = array('name' => $name, 'vorname' => $vorname, 'geb' => gwm_convert_date($geb));
						if($r = gwm_update_by_prop($db, 'patienten', $p, $s, 1)) {
							$newcounter += $r;
						}
					} else {
						if(VERBOSE) { echo "\nNo valid personal data given!!\n"; }
					}
					
				}
				
				
				fclose($fp);
						
				echo "..fertig: {$importcounter} Zeilen eingelesen und {$newcounter} Datensätze geändert!\n";
	
	}
	
?>