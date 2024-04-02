$(document).ready(function() {
    console.log("Document ready.");

    // Trigger for opening the book out modal with item ID
    $('.book-out-btn').on('click', function() {
        var itemId = $(this).data('item-id');
        console.log("Book out button clicked. Item ID: ", itemId);
        $('#bookOutItemId').val(itemId);
    });

    // AJAX call for booking out an item
    $('#bookOutForm').submit(function(e) {
        e.preventDefault(); // Prevent the default form submission
        console.log("Submitting form for booking out. Form data: ", $(this).serialize());
        $.ajax({
            type: "POST",
            url: "/inventory/book_out",
            data: $(this).serialize(),
            success: function(response) {
                console.log("Success response: ", response);
                $('#bookOutModal').modal('hide');
                location.reload();
            },
            error: function(error) {
                console.log("Error occurred: ", error);
            }
        });
    });

     $('.book-in-btn').on('click', function() {
        var itemId = $(this).data('item-id');
        console.log("Attempting to fetch usage records for item ID: ", itemId); // This should not log 'undefined'
        $('#bookInItemId').val(itemId); // Set the hidden input's value to the item ID

        // Clear previous options except the placeholder
        $('#usageSelect').find('option:not(:first)').remove();

        // Fetch usage records for the selected item
        $.ajax({
            url: `/inventory/usage_records/${itemId}`,
            method: 'GET',
            success: function(records) {
                console.log(records);
                records.forEach(function(record) {
                    $('#usageSelect').append(new Option(`${record.item_name}, Out to: ${record.booked_out_to}, Quantity: ${record.booked_out_quantity}, Date: ${record.booked_out_timestamp}`, record.id));
                });
            },
            error: function(error) {
                console.error("Error fetching usage records:", error);
            }
        });
    });

    // AJAX call for booking in an item
    $(document).ready(function() {
    $('.view-usage-btn').on('click', function() {
        var itemId = $(this).data('item-id');
        $.ajax({
            url: `/usage_records/${itemId}`,
            method: 'GET',
            success: function(records) {
                // Handle the response - perhaps populate a modal or a list with the records
                console.log(records); // For testing
                // Here, you'd loop through `records` and append them to your HTML
            },
            error: function(error) {
                console.error("Error fetching usage records:", error);
                // Handle any errors, perhaps show an alert or message to the user
            }
        });
    });
    });

    $('#bookInForm').submit(function(e) {
        e.preventDefault();
        var usageId = $('#usageSelect').val();
        var itemId = $('#bookInItemId').val();
        console.log("Booking in. Item ID: ", itemId, "Usage ID:", usageId);

        $.ajax({
            type: "POST",
            url: `/inventory/book_in/${usageId}`,
            data: { item_id: itemId, usage_id: usageId },
            success: function(response) {
                console.log("Book in successful. Response: ", response);
                $('#bookInModal').modal('hide');
                location.reload();
            },
            error: function(error) {
                console.log("Error booking in: ", error);
            }
        });
    });
});