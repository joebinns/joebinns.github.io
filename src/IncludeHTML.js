/* ----------------------------- Import scripts ----------------------------- */
// Jquery.js
import "jquery";

$(function () {
    var includes = $('[data-include]')
    $.each(includes, function () {
        var file = 'views/' + $(this).data('include') + '.html'
        $(this).load(file)
    })
})