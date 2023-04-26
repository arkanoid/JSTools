function ajaxAndLoad(url, method, data, success, error, spinner) {
	let ajaxCall = {
		url: url,
		method: method,
		success: (r) => {
			$(spinner).hide();
			success(r);
		}
	};

	if (data)
		ajaxCall.data = data;

	if (error) {
		if (typeof error == 'string')
			ajaxCall.error =  (jqXHR, status, thrown) => {
				alert(`${error}: ${this.name} ${status} (${jqXHR.statusText})`);
			}
		else
			ajaxCall.error = error;
	}

	$.ajax(ajaxCall);
}
