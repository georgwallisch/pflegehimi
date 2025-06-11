<?php
	
	require_once 'bootstrap.php';
	require_once '../config.php';
	
/*	
	$bootstrap_config['local_css'][] = 'css/apopi.css';
	$bootstrap_config['local_js'][] = 'js/apopi.js';
	$bootstrap_config['inline_js_vars']['company'] = "'".$company."'"; 
*/		
	bootstrap_head($title);
	
?>

<nav class="navbar navbar-expand-md navbar-dark bg-dark fixed-top">
  <a class="navbar-brand" href="#"><?php echo htmlentities($title); ?></a>
  <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#mainNavbar" aria-controls="mainNavbar" aria-expanded="false" aria-label="Toggle navigation">
    <span class="navbar-toggler-icon"></span>
  </button>
  <div class="collapse navbar-collapse" id="mainNavbar">
    <ul class="navbar-nav mr-auto">
    </ul>
  </div>
</nav>

<main role="main" class="container" id="mainbox">

</main>	

<?php
	bootstrap_foot();
?>