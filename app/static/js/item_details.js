$(document).ready(function() {
    function toggleFilterFields() {
        // Hide all additional filter fields initially
        $('#dateRangeFields, #transactionTypeFields, #monthsFields').addClass('d-none');
        // Show the appropriate filter fields based on the selected filter type
        var filterBy = $('#filterBy').val();
        $('#' + filterBy + 'Fields').removeClass('d-none');
    }

     $('#toggleHistory').click(function() {
        $('#transactionDetails').slideToggle('fast', function() {
            // This callback function is executed after the slideToggle animation completes
            if ($('#transactionDetails').is(':visible')) {
                $('#toggleHistory').text('Hide Transaction History');
            } else {
                $('#toggleHistory').text('Show Transaction History');
            }
        });
    });

    $('#filterBy').change(toggleFilterFields); // Event listener for filter type change
    toggleFilterFields(); // Initial call to set the correct filter fields

    $('#filterForm').submit(function(event) {
        event.preventDefault(); // Stop the form from causing a page refresh
        var formUrl = $(this).attr('action');
        var formData = $(this).serialize();

        // AJAX request to get filtered transactions
        $.ajax({
            url: formUrl,
            type: 'GET',
            data: formData,
            beforeSend: function(xhr) {
                // Set the header so the server knows this is an AJAX request
                xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            },
            success: function(response) {
                var scrollTop = $(window).scrollTop(); // Save the scroll position
                $('#transactionHistory').html(response); // Replace the transaction history HTML
                $(window).scrollTop(scrollTop); // Restore the scroll position
                updateActiveFiltersDisplay(new URLSearchParams(formData)); // Update the active filters display
            },
            error: function(jqXHR, textStatus, errorThrown) {
                alert('Failed to filter transactions. Please try again.');
            }
        });
    });

     function updateActiveFiltersDisplay(params) {
        var filtersHtml = '';
        var isFilterApplied = false;

        // Create filter badges for active filters
        params.forEach(function(value, key) {
            if (value && key !== 'filterBy') { // Skip the filterBy parameter itself
                isFilterApplied = true; // Indicate that a filter has been applied
                var label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                filtersHtml += '<span class="badge badge-secondary">' +
                               label + ': ' + value +
                               ' <button class="clear-filter" data-filter="' +
                               key + '">&times;</button></span> ';
            }
        });

        // If filters have been applied, append the "Clear Filters" button
        if (isFilterApplied) {
            filtersHtml += '<button id="clearFilters" class="btn btn-secondary ml-2">Clear Filters</button>';
        }

        // Inject the filter badges and "Clear Filters" button into the `#activeFilters` div
        $('#activeFilters').html(filtersHtml);
    }
    // Event handler to remove individual filters
    $('#activeFilters').on('click', '.clear-filter', function() {
        $(this).parent().remove(); // Remove the filter badge
        var filterName = $(this).data('filter');
        $('[name="' + filterName + '"]').val(''); // Reset the specific filter input
        $('#filterForm').submit(); // Submit the form to update the filters
    });

    // Event handler for the "Clear Filters" button to reset all filters
      $('#activeFilters').on('click', '#clearFilters', function() {
        $('#filterForm').find('input, select').val(''); // Reset all form fields
        $('#filterForm').submit(); // Submit the form to remove all filters
        toggleFilterFields(); // Reset visibility of filter-specific fields
    });

});