<?php
	// Funktionen zur Berechnug der Prüfsumme nach dem Luhn-Algorithmus
	
	function check_ik($ik) {
		if(!is_string($ik)) {
			$ik = sprintf('%d', $ik);
		} else {
			$ik = trim($ik);
		}
		//if(strlen($ik) != 9) return false;
		
		$last = intval(substr($ik, -1));
		$num = substr($ik, 2, -1);
		
		$pz = calc_luhn($num, true);
		
		if($pz == $last) return true;
		return false;		
	}
	
	function check_vsnr($vsnr) {
		$vsnr = strtoupper(trim($vsnr));
		if(strlen($vsnr) != 10) return false;
		$first = ord($vsnr[0]) - ord('A') + 1;
		$last = intval(substr($vsnr, -1));
		$num = sprintf('%02d', $first);
		$num .= substr($vsnr, 1, 8);
		
		$pz = calc_luhn($num);
		
		if($pz == $last) return true;
		return false;		
	}
	
	function calc_luhn($number, $invert = false) {
		if(!is_string($number)) {
			$num = sprintf('%d', $number);
		} else {
			$num = trim($number);
		}
		$len = strlen($num);
		$sum = 0;
		$j = 1;
		if($invert) $j = 0; 
		for($i = 0; $i < $len; ++$i) {
			$n = intval($num[$i]);
			if($i % 2 == $j) {
				$n *= 2;
			}
			$sum += $n;
			if($n > 9) $sum -= 9;
		}
		
		return $sum % 10;
	}
	
?>