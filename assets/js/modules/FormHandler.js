export default class FormHandler{

    constructor(
        register_endpoint,
        form_selector,
        inputs_and_rules,
        input_error_class,
        error_bag_selector,
        success_alert_selector
    ){
        this.register_endpoint = register_endpoint;

        this.forms = document.querySelectorAll(form_selector);
        this.inputs_and_rules = inputs_and_rules;
        this.input_error_class = input_error_class;
        this.error_bag_selector = error_bag_selector;
        this.success_alert_selector = success_alert_selector;

        this.assignInputsHandlers();
    }

    assignInputsHandlers() {

        this.forms.forEach(form => {
            this.setupLiveValidators(form);

            form.addEventListener('submit', event => {

                event.preventDefault();
                
                const formErrorBag = form.querySelector(this.error_bag_selector);
                const formSuccessBag = form.querySelector(this.success_alert_selector);
                this.flushAlerts(formErrorBag, formSuccessBag);

                const errors = [];

                for (const querySelector in this.inputs_and_rules){
                    const input = form.querySelector(querySelector);
                    const inputParams = this.inputs_and_rules[querySelector];

                    // Arrays is objects too
                    if (typeof inputParams.submitValidators === 'object'){
                        inputParams.submitValidators.forEach(validator => {

                            const error_message = validator(input.value, inputParams.inputName);

                            if (error_message !== undefined){
                                input.classList.add(this.input_error_class);

                                errors.push(error_message);
                            }
                        })
                    }
                }

                if (errors.length !== 0){
                    this.placeErrorsToBag(formErrorBag, errors);
                    return;
                }

                this.handleFormSubmit(form, event, formErrorBag, formSuccessBag);
            })
        })
    }

    setupLiveValidators(form){

        for (const querySelector in this.inputs_and_rules){

            const input = form.querySelector(querySelector);
            const inputParams = this.inputs_and_rules[querySelector];

            input.addEventListener('input', event => {

                input.classList.remove(this.input_error_class);

                if (typeof inputParams.liveValidator === "function") {
                    inputParams.liveValidator(event, input);
                }
            });
        }
    }

    async handleFormSubmit(form, event, formErrorBag, formSuccessBag) {

        const requestFormData = new FormData(form);

        if(typeof event.submitter.dataset?.paymentMethod !== undefined){
            requestFormData.append('paymentMethod', event.submitter.dataset.paymentMethod);
        }

        event.preventDefault();
        const requestUrl = this.register_endpoint;

        let token = document.head.querySelector("meta[name='_token']").content;

        const response = await fetch(requestUrl, {
            headers: {
                'X-CSRF-TOKEN': token,
                'Accept': 'application/json'
            },
            credentials: "same-origin",
            method:'post', 
            body: requestFormData,
        })
            
        if (response.status == 422) {
            this.placeErrorsToBag(formErrorBag, ["?????????????????? ???????? ???????????? ???? ???????????? ?????????????????? ?? ??????????????"]);
            return;
        }
        const responseJSON = await response.json();

        try {
            if (response.status == 200) {
                switch(responseJSON['method']) {
                    case 'success':

                        if(typeof responseJSON['paylink'] !== 'undefined'){
                            window.location.href = responseJSON['paylink'];
                        }

                        this.placeSuccessMessagesToBag(formSuccessBag, [responseJSON['message']]);
                        break;
                    case 'error':
                        this.placeErrorsToBag(formErrorBag, [responseJSON['message']]);
                        break;
                }
            } else {
                let message = '?????????????????? ???????????? ??????????????, ????????????????????, ?????????????????? ??????????';
                
                if(typeof responseJSON['message'] !== undefined){
                    message = responseJSON['message']
                }
                
                this.placeErrorsToBag(formErrorBag, [message]);
            }
        } catch(err) {
            console.log(err);
            this.placeErrorsToBag(formErrorBag, ['?????????????????? ????????????']);
        }
        
    }

    flushAlerts(errorBag, successBag) {
        errorBag.innerHTML = '';
        successBag.innerHTML = '';
    }

    placeErrorsToBag(errorBag, errors){
        let HTML = '';

        errors.forEach(errorMessage => {
            HTML += '<li>' + errorMessage + '</li>';
        });

        errorBag.innerHTML = HTML;
    }

    placeSuccessMessagesToBag(successBag, messages){
        let HTML = '';

        messages.forEach(message => {
            HTML += '<li>' + message + '</li>';
        });

        successBag.innerHTML = HTML;
    }

}
