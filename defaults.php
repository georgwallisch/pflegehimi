<?php
/* Default definitions */

	error_reporting(E_ALL & ~E_NOTICE);
	
	//define('VERBOSE', false);
	
	require_once 'gwlib_mysqli.php';
	
	$title = 'PflegeHiMi';
	
	$bootstrap_config['global_js']['momentJS'] = 'moment_js';
	
	$bootstrap_config['local_css'][] = 'css/pflegehimi.css';
	$bootstrap_config['local_js'][]  =  'js/pflegehimi.js';

	$bootstrap_config['local_js'][] = 'https://intern.apotheke-schug.de/js/tablesorter/dist/js/jquery.tablesorter.min.js'; #integrity="sha384-+PEWXCk8F17zxsQsEjkuHjUN4yFMHv03eKxKLrqwDql8FJQM0NeSvHRZFVLfXyn7"
	
	
?>