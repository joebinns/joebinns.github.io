/* ----------------------------- Import scripts ----------------------------- */
// Jquery.js
import "jquery";

// Source: https://stackoverflow.com/a/31837264
$(function () {
    var includes = $('[data-include]')
    $.each(includes, function () {
        var file = 'views/' + $(this).data('include') + '.html'
        $(this).load(file)
    })
})