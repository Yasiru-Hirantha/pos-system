// import {LocalDateTime, DateTimeFormatter} from '@js-joda/core';
import {DateTimeFormatter, LocalDateTime} from '../node_modules/@js-joda/core/dist/js-joda.esm.js';
// import {Big} from 'big.js';
import {Big} from '../node_modules/big.js/big.mjs';
import {Order} from "./order.js";

/* Module Level Variables, Constants */
const REST_API_BASE_URL = 'http://localhost:8080/pos';
const WS_API_BASE_URL = 'ws://localhost:8080/pos';
const orderDateTimeElm = $("#order-date-time");
const tbodyElm = $("#tbl-order tbody");
const txtCustomer = $("#txt-customer");
const customerNameElm = $("#customer-name");
const txtCode = $("#txt-code");
const frmOrder = $("#frm-order");
const txtQty = $("#txt-qty");
let customer = null;
let item = null;
let socket = null;
let order = new Order();

/* Initialization Logic */
setDateTime();
tbodyElm.empty();
socket = new WebSocket(`${WS_API_BASE_URL}/customers-ws`);
updateOrderDetails();

/* Event Handlers & Timers */
setInterval(setDateTime, 1000);
txtCustomer.on('input', () => findCustomer());
txtCustomer.on('blur', () => {
    if (txtCustomer.val() && !customer) {
        txtCustomer.addClass("is-invalid");
    }
});
$("#btn-clear-customer").on('click', () => {
    customer = null;
    order.setCustomer(customer);
    customerNameElm.text("Walk-in Customer");
    txtCustomer.val("");
    txtCustomer.removeClass("is-invalid");
    txtCustomer.trigger("focus");
});
socket.addEventListener('message', (eventData) => {
    customer = JSON.parse(eventData.data);
    order.setCustomer(customer);
    customerNameElm.text(customer.name);
});
txtCode.on('change', () => findItem());
frmOrder.on('submit', (eventData) => {
    eventData.preventDefault();
    addItemToCart(item);
    order.addItem(item);
});

/* Functions */

function updateOrderDetails() {
    txtCustomer.val(('C' + order.customer?.id.toString().padStart(3, '0')) ?? '');
    customerNameElm.text(order.customer?.name);
    order.itemList.forEach(item => addItemToCart(item));
}

function addItemToCart(item) {
    const trElm = $(`<tr>
                    <td>
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <div class="fw-bold">${item.code}</div>
                                <div>${item.description}</div>
                            </div>
                            <svg data-bs-toggle="tooltip" data-bs-title="Remove Item" xmlns="http://www.w3.org/2000/svg"
                                 width="32" height="32" fill="currentColor" class="bi bi-trash delete"
                                 viewBox="0 0 16 16">
                                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Z"/>
                                <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1ZM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118ZM2.5 3h11V2h-11v1Z"/>
                            </svg>
                        </div>
                    </td>
                    <td>
                        ${item.qty}
                    </td>
                    <td>
                        ${formatNumber(item.unitPrice)}
                    </td>
                    <td>
                        ${formatNumber(Big(item.unitPrice).times(Big(item.qty)))}
                    </td>
                </tr>`);
    tbodyElm.append(trElm);
}

function findItem() {
    const description = $("#description");
    const stock = $("#stock span");
    const unitPrice = $("#unit-price");
    const itemInfo = $("#item-info");
    const code = txtCode.val().trim();

    description.text("");
    stock.text("");
    unitPrice.text("");
    itemInfo.addClass("d-none");
    frmOrder.addClass("d-none");
    txtCode.removeClass("is-invalid");
    item = null;

    if (!code) return;

    const jqxhr = $.ajax(`${REST_API_BASE_URL}/items/${code}`);
    txtCode.attr('disabled', true);
    jqxhr.done((data) => {
        item = data;
        description.text(item.description);
        stock.text(item.qty ? `In Stock: ${item.qty}` : 'Out of Stock');
        !item.qty ? stock.addClass("out-of-stock") : stock.removeClass("out-of-stock");
        unitPrice.text(formatPrice(item.unitPrice));
        itemInfo.removeClass("d-none");
        if (item.qty) {
            frmOrder.removeClass("d-none");
            txtQty.trigger("select");
        }
    });
    jqxhr.fail(() => {
        txtCode.addClass("is-invalid");
        txtCode.trigger('select');
    });
    jqxhr.always(() => {
        txtCode.removeAttr("disabled");
        if (!item?.qty) {
            txtCode.trigger("select");
        }
    });
}

function formatPrice(price) {
    return new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: 'LKR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(price);
}

function formatNumber(number) {
    return new Intl.NumberFormat('en-LK', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(number);
}

function setDateTime() {
    const now = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    orderDateTimeElm.text(now);
}

function findCustomer() {
    const idOrContact = txtCustomer.val().trim().replace('C', '');

    txtCustomer.removeClass("is-invalid");
    if (!idOrContact) return;
    customer = null;
    customerNameElm.text("Walk-in Customer");
    order.setCustomer(null);

    if (socket.readyState === socket.OPEN) socket.send(idOrContact);
}
