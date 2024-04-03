    // Function to display or hide the new category input

    document.addEventListener('DOMContentLoaded', () => {
        let addSupplierBtn = document.getElementById('addSupplierBtn');
        if (addSupplierBtn) {
            addSupplierBtn.addEventListener('click', () => {
                $('#supplierModal').modal('show');
            });
        }

        let addCategoryBtn = document.getElementById('addCategoryBtn');
        if (addCategoryBtn) {
            addCategoryBtn.addEventListener('click', () => {
                $('#categoryModal').modal('show');
            });
        }

        initSearch();
        fetchCategories();
        setupImageDisplayAndChange();
    });

    document.getElementById('item_image').addEventListener('change', function(event) {
        if (this.files && this.files[0]) {
            var reader = new FileReader();
            reader.onload = function(e) {
                // Assuming there's an <img> element inside #itemImageDisplay for showing the image
                var imgDisplay = document.querySelector('#itemImageDisplay img');
                if (imgDisplay) {
                    imgDisplay.src = e.target.result;
                } else {
                    // If no <img> exists, create one
                    var newImg = document.createElement('img');
                    newImg.src = e.target.result;
                    newImg.style.maxWidth = "300px"; // Set the size as needed
                    newImg.style.maxHeight = "300px";
                    document.getElementById('itemImageDisplay').appendChild(newImg);
                }
                // Hide the upload form and show the change image button
                document.getElementById('imageUploadForm').style.display = 'none';
                var changeImageButton = document.getElementById('changeImageButton');
                if (changeImageButton) {
                    changeImageButton.style.display = 'block';
                } else {
                    // If the button doesn't exist, create it
                    var newButton = document.createElement('button');
                    newButton.textContent = 'Change Image';
                    newButton.type = 'button';
                    newButton.id = 'changeImageButton';
                    newButton.addEventListener('click', function() {
                        document.getElementById('imageUploadForm').style.display = 'block';
                        this.style.display = 'none';
                    });
                    document.getElementById('itemImageDisplay').appendChild(newButton);
                }
            };
            reader.readAsDataURL(this.files[0]);
        }
    });

    function initSearch() {
        let searchFields = document.querySelectorAll('#name, #supplier_part_no');
        searchFields.forEach(field => {
            field.addEventListener('input', handleItemSearch);
        });
    }

    function handleItemSearch() {
        const query = this.value.trim();
        const searchType = this.id; // "name" or "supplier_part_no"
        const resultsContainerId = searchType === 'name' ? 'nameSearchResults' : 'partNoSearchResults';
        const searchResults = document.getElementById(resultsContainerId);

        if (!searchResults) {
            console.error(`Search results container with ID ${resultsContainerId} not found.`);
            return;
        }

        if (query.length === 0) {
            searchResults.innerHTML = '';
            searchResults.style.display = 'none';
        } else if (query.length >= 2) {
            fetch(`/inventory/search_items?type=${searchType}&q=${encodeURIComponent(query)}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                searchResults.innerHTML = '';
                data.forEach(item => {
                    const div = document.createElement('div');
                    div.textContent = searchType === 'name' ? item.name : item.supplier_part_no;
                    div.className = "search-result-item";
                    div.dataset.item = JSON.stringify(item);
                    div.addEventListener('click', () => selectItem(item, searchType));
                    searchResults.appendChild(div);
                });
                searchResults.style.display = data.length > 0 ? 'block' : 'none';
            }).catch(e => {
                console.error('Search failed:', e);
            });
        } else {
            searchResults.innerHTML = '';
            searchResults.style.display = 'none';
        }
    }

    function selectItem(item, searchType) {
    document.getElementById('name').value = item.name;
    document.getElementById('supplier_part_no').value = item.supplier_part_no;
    // Fill the other fields as needed
    document.getElementById('description').value = item.description;
    document.getElementById('supplier_id').value = item.supplier_id;
    document.getElementById('category').value = item.category;

    // Hide the search results
    document.getElementById('nameSearchResults').style.display = 'none';
    document.getElementById('partNoSearchResults').style.display = 'none';

    // Update the item image display
    updateItemImageDisplay(item.image_filename);
}

function updateItemImageDisplay(imageFilename) {
    const imageDisplayArea = document.getElementById('itemImageDisplay');
    const imageUploadForm = document.getElementById('imageUploadForm');

    if (imageFilename) {
        // If there is an image, display it with a "Change Image" button
        imageDisplayArea.innerHTML = `<img src="/static/img/item_images/${imageFilename}" alt="Item Image" style="max-width: 300px; max-height: 300px;">
        <button type="button" id="changeImageButton">Change Image</button>`;
        imageUploadForm.style.display = 'none'; // Hide upload form initially

        document.getElementById('changeImageButton').addEventListener('click', function(event) {
            event.preventDefault(); // Prevent any form submission
            imageUploadForm.style.display = 'block'; // Show the upload form
            this.style.display = 'none'; // Hide the "Change Image" button
        });
    } else {
        // If no image, just show the upload field
        imageDisplayArea.innerHTML = '';
        imageUploadForm.style.display = 'block';
    }
}

function setupImageDisplayAndChange() {
    const existingImageFilename = document.getElementById('existingImageFilename') ? document.getElementById('existingImageFilename').value : null;
    updateItemImageDisplay(existingImageFilename);
}


    function addNewCategory() {
        const newCategoryName = document.getElementById('new_category_name').value.trim();

        if (!newCategoryName) {
            alert('Please enter a category name.');
            return; // Exit the function if the category name is empty
        }

        let formData = new FormData();
        formData.append('categoryName', newCategoryName);

        fetch('/inventory/add_category', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // After the category is added successfully, dynamically update the dropdown
                let categorySelect = document.getElementById('category');
                let newOption = new Option(newCategoryName, data.categoryId); // assuming your backend returns the new category's ID as categoryId
                categorySelect.appendChild(newOption); // append the new option
                categorySelect.value = data.categoryId; // make the new option selected
                $('#categoryModal').modal('hide'); // Hide modal on success
                alert('Category added successfully');
                // Refresh the form here if necessary
            } else {
                alert(data.message);
            }
        })
        .catch(error => {
            console.error('Error adding category:', error);
            alert('An error occurred while adding the category.');
        });
    }

    function fetchCategories() {
        fetch('/inventory/get_categories')
        .then(response => response.json())
        .then(data => {
            const categorySelect = document.getElementById('category');
            // Initialize the dropdown with the placeholder option that is not disabled
            categorySelect.innerHTML = '<option value="">Select a category...</option>';

            // Populate the dropdown with categories fetched from the server
            data.forEach(category => {
                const option = new Option(category.name, category.name);
                categorySelect.add(option);
            });


            // Initially select the placeholder option
            categorySelect.value = "";

            // Disable the placeholder option after any other option is selected
            categorySelect.addEventListener('change', function() {
                if (this.value !== "") {
                    // When a valid category is selected, disable the placeholder
                    this.querySelector('option[value=""]').disabled = true;
                }
            });
        })
        .catch(error => console.error('Error fetching categories:', error));
    }



    // Form validation logic
    (function() {
        'use strict';
        window.addEventListener('load', function() {
            // Fetch all the forms we want to apply custom Bootstrap validation styles to
            var forms = document.getElementsByClassName('needs-validation');
            // Loop over them and prevent submission
            Array.prototype.filter.call(forms, function(form) {
                form.addEventListener('submit', function(event) {
                    if (form.checkValidity() === false) {
                        event.preventDefault();
                        event.stopPropagation();
                    }
                    form.classList.add('was-validated');
                }, false);
            });
        }, false);
    })();

    function addNewSupplier() {
        const name = document.getElementById('new_supplier_name').value.trim();
        const telephone_number = document.getElementById('new_supplier_telephone_number').value.trim();
        const address = document.getElementById('new_supplier_address').value.trim();
        const contact_person = document.getElementById('new_supplier_contact_person').value.trim();

        // Prepare data to be sent to the server
        var formData = new FormData();
        formData.append('name', name);
        formData.append('telephone_number', telephone_number);
        formData.append('address', address);
        formData.append('contact_person', contact_person);

        // AJAX call to server to add new supplier
        fetch('/inventory/add_supplier', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Ensure that 'id' or the correct key is used for getting the supplier ID
                let supplierSelect = document.getElementById('supplier_id');
                let newOption = new Option(name, data.id); // Replace 'id' with the actual key returned from your backend
                supplierSelect.add(newOption);
                supplierSelect.value = data.id; // This sets the value to the newly added supplier's ID
                $('#supplierModal').modal('hide');
                alert('Supplier added successfully');
            } else {
                alert(data.message);
            }
        })
        .catch(error => {
            console.error('Error adding supplier:', error);
            alert('An error occurred while adding the supplier.');
        });
    }
