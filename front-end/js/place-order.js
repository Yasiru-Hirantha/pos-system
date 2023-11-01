// import {LocalDateTime, DateTimeFormatter} from '@js-joda/core';
import {DateTimeFormatter, LocalDateTime} from '../node_modules/@js-joda/core/dist/js-joda.esm.js';

/* Module Level Variables, Constants */
const REST_API_BASE_URL = 'http://localhost:8080/pos';
const WS_API_BASE_URL = 'ws://localhost:8080/pos';
const orderDateTimeElm = $("#order-date-time");
const tbodyElm = $("#tbl-order tbody");
const txtCustomer = $("#txt-customer");
let customer = null;
let socket = null;

/* Initialization Logic */
setDateTime();
tbodyElm.empty();
socket = new WebSocket(`${WS_API_BASE_URL}/customers-ws`);

/* Event Handlers & Timers */
setInterval(setDateTime, 1000);
txtCustomer.on('input', () => findCustomer());
txtCustomer.on('blur', ()=> {
    if (txtCustomer.val() && !customer){
        txtCustomer.addClass("is-invalid");
    }
});
$("#btn-clear-customer").on('click', ()=> {
    customer = null;
    $("#customer-name").text("Walk-in Customer");
    txtCustomer.val("");
    txtCustomer.removeClass("is-invalid");
    txtCustomer.trigger("focus");
});
socket.addEventListener('message', (eventData)=> {
    customer = JSON.parse(eventData.data);
    $("#customer-name").text(customer.name);
});

/* Functions */
function setDateTime() {
    const now = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    orderDateTimeElm.text(now);
}

function findCustomer() {
    const customerNameElm = $("#customer-name");
    const idOrContact = txtCustomer.val().trim().replace('C', '');

    txtCustomer.removeClass("is-invalid");
    if (!idOrContact) return;
    customer = null;
    customerNameElm.text("Walk-in Customer");

    if (socket.readyState === socket.OPEN) socket.send(idOrContact);
}
