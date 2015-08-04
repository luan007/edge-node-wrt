define([
	'jquery',
	'tweenMax',
	'easelPlugin'
], function ($) {

	$(document).ready(function () {
		loadPerspectBg('.page-bg');
		var $tabBtn = $('.tab>.btn-group>.btn');

		$tabBtn.click(function () {
			if (!$(this).hasClass('active')) {
				$tabBtn.removeClass('active');
				$(this).addClass('active');
				var target = $(this).attr('data-target');
				$('.tab-content').fadeOut();
				$(target).fadeIn();
			}
		});
	})

	return {};
});