
var bannercontent ='';
bannercontent = bannercontent+'<iframe id="banner" src="http://raquel.dwalliance.com/fetchdeals/banners/banner_noautoredirect.php?mid='+scriptOptions.mid+'&memid='+scriptOptions.memid+'" scrolling="no"></iframe>';


var stylecontent = '<style>';
stylecontent = stylecontent +'#banner { background:white; width:100%; display:none; frameborder:0; align:center; height:66px; seamless:seamless; box-shadow: 2px 0px 2px #000; position: relative;  z-index: 9999;}';
stylecontent = stylecontent +'</style>'

$('body').prepend(bannercontent);
$('body').prepend(stylecontent);
$("#banner").slideDown("slow");
