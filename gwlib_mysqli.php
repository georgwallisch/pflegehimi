<?php

	function gwm_get_id($db, $table, $key, $value, $type = 's') {
		
		$st = $db->stmt_init();		
		$st->prepare('SELECT id FROM '.$table.' WHERE '.$key.'=?');
		
		$st->bind_param($type, $value);
		$st->execute();
		
		$result = $st->get_result();
		
		$ret = false;
		
		if($result->num_rows == 1) {
			$row = $result->fetch_assoc();
			$ret = $row['id'];
		} elseif($result->num_rows > 1) {
			$ret = array();
			$rows = $result->fetch_all(MYSQLI_ASSOC);
			foreach ($rows as $row) {
				$ret[] = $row['id'];
			}			
		}
		
		$result->free();
		
		return $ret;	
	}
	
	function gwm_update_by_id($db, $table, $id, $data) {
		
		if(!is_int($id)) {
			echo "UPDATE Error: Given ID is not an integer!\n";
			return false;
		} 
			
		$sets = array();
						
		foreach($data as $k => $v) {			
			if(is_string($v)) {
				$sets[] = "$k='$v'";
			} elseif(is_null($v)) {
				$sets[] = "$k=NULL";
			} else {
				$sets[] = "$k=$v";
			}						
		}
		
		$q = 'UPDATE '.$table.' SET '.implode(', ', $sets).' WHERE id='.$id.' LIMIT 1';
				
		$st = $db->stmt_init();		
		$st->prepare($q);
		return $st->execute();	
	}
	
	function gwm_mapdata($data, $map) {
		
		$newdata = array();
		
		foreach($data as $k => $v) {			
			if(($key = array_search($k, $map)) !== false) {
				if(is_null($v) or $v == '') continue;
				$newdata[$key] = $v;
			}
		}
		
		return $newdata;	
	}
		
	function gwm_create($db, $table, $data, $bindmap) {
		
		$values = array();
		$keys = array();
		
		$bind = '';
		
		foreach($data as $k => $v) {			
			$values[] = $v;
			$keys[] = $k;
			
			if(($index = array_search($k, $bindmap)) !== false) {
				$bind .= $bindmap[$index];
			} else {
				$bind .= 's';
			}				
		}
		
		$q = 'INSERT INTO '.$table.' ('.implode(',',$keys).') VALUES (?'.str_repeat(',?', count($values) - 1).')';

		/*
		if(VERBOSE) {
			echo "\nInserting into $table:\nKeys:\n";
			print_r($keys);
			echo "\nValues:\n";
			print_r($values);
			echo "\n$q\n\n";			
		}
		*/
		
		$st = $db->stmt_init();		
		$st->prepare($q);
		$st->bind_param($bind, ...$values);			
		return $st->execute();		
	}

?>