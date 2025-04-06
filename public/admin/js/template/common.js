document.addEventListener("DOMContentLoaded", function () {
    const links = document.querySelectorAll(".sidebar .nav-link");

    links.forEach(link => {
        link.addEventListener("click", function () {
            // Remove active class from all links
            links.forEach(l => l.classList.remove("active"));

            // Add active class to clicked link
            this.classList.add("active");

            // Ensure parent module stays open when clicking submodule
            if (this.classList.contains("sub-link")) {
                const parentMenu = this.closest("ul.collapse");
                if (parentMenu) {
                    const parentModule = parentMenu.previousElementSibling;
                    if (parentModule) {
                        parentModule.classList.add("active");
                        parentMenu.classList.add("show");
                    }
                }
            }
        });
    });

    // Preserve active state on page load
    const currentPath = window.location.pathname;
    links.forEach(link => {
        if (link.getAttribute("href") === currentPath) {
            link.classList.add("active");

            if (link.classList.contains("sub-link")) {
                const parentMenu = link.closest("ul.collapse");
                if (parentMenu) {
                    parentMenu.classList.add("show");
                    const parentModule = parentMenu.previousElementSibling;
                    if (parentModule) {
                        parentModule.classList.add("active");
                    }
                }
            }
        }
    });
});

toastr.options = {
    "closeButton": true,
    "debug": false,
    "newestOnTop": false,
    "progressBar": true,
    "positionClass": "toast-top-right",
    "preventDuplicates": false,
    "onclick": null,
    "showDuration": "300",
    "hideDuration": "1000",
    "timeOut": "5000",
    "extendedTimeOut": "5000",
    "showEasing": "swing",
    "hideEasing": "linear",
    "showMethod": "fadeIn",
    "hideMethod": "fadeOut"
};

let ckEditor; // Declare editor outside the create function

ClassicEditor.create(document.querySelector('#testmonial_description'))
    .then(editor => {
        ckEditor = editor;
    })
    .catch(error => {
        console.error(error);
    });

// Image Preview Functionality
$('.image_view').change(function () {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            $('#imagePreview').attr('src', e.target.result);
            $('#imagePreviewContainer').show();
        }
        reader.readAsDataURL(file);
    } else {
        $('#imagePreview').attr('src', '#');
        $('#imagePreviewContainer').hide();
    }
});