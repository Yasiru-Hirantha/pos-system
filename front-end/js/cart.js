// import {Big} from 'big.js';
import {Big} from '../node_modules/big.js/big.mjs';

export class Cart {
    customer = null;
    itemList = [];

    constructor() {
        if (localStorage.getItem("order")){
            const order = JSON.parse(localStorage.getItem("order"));
            this.customer = order.customer;
            this.itemList = order.itemList;
        }
        this.#updateOrder();
    }

    setCustomer(customer){
        this.customer = customer;
        this.#updateOrder();
    }

    addItem(item){
        this.itemList.push(item);
        this.#updateOrder();
    }

    updateItemQty(code, qty){
        if (!this.containItem(code)) return;
        this.getItem(code).qty = qty;
        this.#updateOrder();
    }

    deleteItem(code){
        const index = this.itemList.indexOf(this.getItem(code));
        this.itemList.splice(index, 1);
        this.#updateOrder();
    }

    getItem(code){
        return this.itemList.find(item => item.code === code);
    }

    containItem(code){
        return !!this.getItem(code);
    }

    getTotal(){
        let total = new Big(0);
        this.itemList.forEach(item => {
            total.plus(Big(item.qty).times(Big(item.unitPrice)));
        })
        return total;
    }

    #updateOrder(){
        localStorage.setItem("order", JSON.stringify(this));
    }
}