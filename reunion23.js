//  Build a summary, and total cost
function buildSummary(){
	$("#regsummary").html("<strong>Registration Summary</strong>\r\n")
	
	var totalcost = 0;

	// Loop through each Replicate Block
	// START REPLICANT BLOCK LOOP
	$('[data-replicate_id],.replicate_destination').each(function() {
			
		// Registrant Name Info
		var fname = $(this).find('[data-export="sys:first"] input').val()
		var lname = $(this).find('[data-export="sys:last"] input').val()		
		console.log(fname + ' ' + lname, ' - ', tickettype  )
		$("#regsummary").append("<div><br>\n<strong>"+fname + ' ' + lname + "\r\n</strong></div>")
		
		// Check for Registration Fee
		var tickettype = $(this).find('[data-export="ticket-type"] select').val()
		if(tickettype == "general"){ 
			totalcost += 5;  // Each Registration costs $5 for general tickets
			$("#regsummary").append("<div>Registration Fee ($5)</div>\n")
		}
		
			// Check for Comp ticket and apply discount
		var comptix = $(this).find('[data-export="comptix"] select').val()
		if(comptix == "comptix"){ 
			totalcost -= 5;  // Comp General Registration Fee ($5)
			$("#regsummary").append("<div>Comp Registration Fee</div>\n")
		}

		// Add up Events
		var events = $(this).find('[data-export*="event_"],[data-export*="houseing_"]')
		events.each(function(){
			if ($(this).find('input').is(':checked') && !$(this).hasClass("hidden")){
				var thisid = $(this).data('export')
				var thisname = $(this).find('input').first().data('text')
								var thiscost = $(this).find('.data-cost').first().text()
								totalcost += +thiscost;
				console.log(thisname)
				$("#regsummary").append("<div>"+thisname + "</div>\n")
			}
		})


		//  Add Giving information
		if($(this).find('[data-export="form-gift-yes-no"] input:checked').val() === 'Y'){
			var giftamt =  $(this).find('[data-export="sys:gift:amount"] input').val()
			var giftval = Math.abs(Number(giftamt.replace(/[^0-9.-]+/g,"")))
		
			totalcost += giftval;		
			$("#regsummary").append("<div><strong>Gift to Macalester Fund: $"+giftval + "</strong></div>\n")
		}



	// END REPLICANT BLOCK LOOP
	});


//   console.log(form.getElement('form-gift-yes-no').selected())
   console.log( $('[data-export="form-gift-yes-no"] input:checked').val())
	
	$("#regsummary").append("\n\n<br /><div><strong>Registration Total: $"+totalcost + "</strong></div>")
	form.getElement('cost_total_group').val(totalcost);
	let totalElemID = form.getElement('cost_total_group').attr('id');
	let totalElem = document.getElementById(totalElemID);
	totalElem.dispatchEvent(new Event('change', { 'bubbles': true }));

	form.getElement('registration_summary').val($("#regsummary").text());
	
}


let checkboxes = $("input[type=checkbox]")

// Attach a change event handler to the checkboxes.
//checkboxes.change(buildSummary);
$("body").on("click", "input", buildSummary);
$("body").on("blur", "input", buildSummary);


