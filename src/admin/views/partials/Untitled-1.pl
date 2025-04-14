<div class="sidebar p-3">
    <h4 class="text-center mb-4">🚚 OnPoint</h4>
    <ul class="nav flex-column" id="sidebarMenu">

        <!-- Dashboard -->
        <li class="nav-item mb-2 <%= !sidebar.dashboard ? 'd-none' : '' %>">
            <a href="/dashboard" class="nav-link"><i class="bi bi-house me-2"></i>Dashboard</a>
        </li>

        <!-- Role Management -->
        <li class="nav-item mb-2 <%= !sidebar.roleManagement ? 'd-none' : '' %>">
            <a class="nav-link d-flex justify-content-between align-items-center" data-bs-toggle="collapse"
                href="#roleMenu" role="button">
                <span><i class="bi bi-person-gear me-2"></i> Role Management</span>
                <i class="bi bi-chevron-down"></i>
            </a>
            <ul class="collapse list-unstyled ps-3" id="roleMenu">
                <li class="sub-item <%= !sidebar.manageRoles ? 'd-none' : '' %>">
                    <a href="/roles/rolesManagement" class="nav-link sub-link"><i
                            class="bi bi-briefcase me-2"></i>Manage Roles</a>
                </li>
                <li class="sub-item <%= !sidebar.backendUsers ? 'd-none' : '' %>">
                    <a href="/roles/backendUserManagement" class="nav-link sub-link"><i
                            class="bi bi-person me-2"></i>Backend Users</a>
                </li>
            </ul>
        </li>

        <!-- User Management -->
        <li class="nav-item mb-2 <%= !sidebar.userManagement ? 'd-none' : '' %>">
            <a class="nav-link d-flex justify-content-between align-items-center" data-bs-toggle="collapse"
                href="#userMenu" role="button">
                <span><i class="bi bi-people me-2"></i> User Management</span>
                <i class="bi bi-chevron-down"></i>
            </a>
            <ul class="collapse list-unstyled ps-3" id="userMenu">
                <li class="sub-item <%= !sidebar.manageUsers ? 'd-none' : '' %>">
                    <a href="/users/userManagement" class="nav-link sub-link"><i
                            class="bi bi-person-lines-fill me-2"></i>Manage Users</a>
                </li>
            </ul>
        </li>

        <!-- Orders & Shipments -->
        <li class="nav-item mb-2 <%= !sidebar.orderManagement ? 'd-none' : '' %>">
            <a class="nav-link d-flex justify-content-between align-items-center" data-bs-toggle="collapse"
                href="#orderMenu" role="button">
                <span><i class="bi bi-box-seam me-2"></i> Orders & Shipments</span>
                <i class="bi bi-chevron-down"></i>
            </a>
            <ul class="collapse list-unstyled ps-3" id="orderMenu">
                <li class="sub-item <%= !sidebar.manageOrders ? 'd-none' : '' %>">
                    <a href="/order/orderManagement" class="nav-link sub-link"><i
                            class="bi bi-card-checklist me-2"></i>Order Management</a>
                </li>
                <li class="sub-item <%= !sidebar.manageShipments ? 'd-none' : '' %>">
                    <a href="/shipment/shipmentManagement" class="nav-link sub-link"><i
                            class="bi bi-truck-flatbed me-2"></i>Shipment Management</a>
                </li>
            </ul>
        </li>

        <!-- Warehouse Management -->
        <li class="nav-item mb-2 <%= !sidebar.warehouseManagement ? 'd-none' : '' %>">
            <a class="nav-link d-flex justify-content-between align-items-center" data-bs-toggle="collapse"
                href="#warehouseMenu" role="button">
                <span><i class="bi bi-building me-2"></i> Warehouse Management</span>
                <i class="bi bi-chevron-down"></i>
            </a>
            <ul class="collapse list-unstyled ps-3" id="warehouseMenu">
                <li class="sub-item <%= !sidebar.manageWarehouse ? 'd-none' : '' %>">
                    <a href="/warehouse/warehouseManagement" class="nav-link sub-link"><i
                            class="bi bi-boxes me-2"></i>Manage Warehouse</a>
                </li>
            </ul>
        </li>

        <!-- Configuration -->
        <li class="nav-item mb-2 <%= !sidebar.configuration ? 'd-none' : '' %>">
            <a class="nav-link d-flex justify-content-between align-items-center" data-bs-toggle="collapse"
                href="#configuration" role="button">
                <span><i class="bi bi-building me-2"></i> Configuration</span>
                <i class="bi bi-chevron-down"></i>
            </a>
            <ul class="collapse list-unstyled ps-3" id="configuration">
                <li class="sub-item <%= !sidebar.appSetting ? 'd-none' : '' %>">
                    <a href="/configuration/appSetting" class="nav-link sub-link"><i class="bi bi-boxes me-2"></i>App
                        Setting</a>
                </li>
            </ul>
        </li>

        <!-- Website Management -->
        <li class="nav-item mb-2 <%= !sidebar.websiteManagement ? 'd-none' : '' %>">
            <a class="nav-link d-flex justify-content-between align-items-center" data-bs-toggle="collapse"
                href="#websiteManagement" role="button">
                <span><i class="bi bi-building me-2"></i> Website Management</span>
                <i class="bi bi-chevron-down"></i>
            </a>
            <ul class="collapse list-unstyled ps-3" id="websiteManagement">
                <li class="sub-item <%= !sidebar.manageBanners ? 'd-none' : '' %>">
                    <a href="/banner/bannerManagement" class="nav-link sub-link"><i class="bi bi-boxes me-2"></i>Banner
                        Management</a>
                </li>
                <li class="sub-item <%= !sidebar.manageBlogs ? 'd-none' : '' %>">
                    <a href="/blogs/blogsManagement" class="nav-link sub-link"><i class="bi bi-boxes me-2"></i>Blogs
                        Management</a>
                </li>
                <li class="sub-item <%= !sidebar.manageContactUs ? 'd-none' : '' %>">
                    <a href="/contactUs/contactUs" class="nav-link sub-link"><i class="bi bi-boxes me-2"></i>Contact
                        Us</a>
                </li>
                <li class="sub-item <%= !sidebar.manageTestimonials ? 'd-none' : '' %>">
                    <a href="/testimonial/testimonialManagement" class="nav-link sub-link"><i
                            class="bi bi-boxes me-2"></i>Testimonial Management</a>
                </li>
            </ul>
        </li>

        <!-- Driver Management -->
        <li class="nav-item mb-2 <%= !sidebar.driverManagement ? 'd-none' : '' %>">
            <a class="nav-link d-flex justify-content-between align-items-center" data-bs-toggle="collapse"
                href="#driverManagement" role="button">
                <span><i class="bi bi-building me-2"></i> Driver Management</span>
                <i class="bi bi-chevron-down"></i>
            </a>
            <ul class="collapse list-unstyled ps-3" id="driverManagement">
                <li class="sub-item <%= !sidebar.manageDocuments ? 'd-none' : '' %>">
                    <a href="/document/documentManagement" class="nav-link sub-link"><i
                            class="bi bi-boxes me-2"></i>Manage Document</a>
                </li>
                <li class="sub-item <%= !sidebar.manageDrivers ? 'd-none' : '' %>">
                    <a href="/driver/driverManagement" class="nav-link sub-link"><i class="bi bi-boxes me-2"></i>Manage
                        Drivers</a>
                </li>
            </ul>
        </li>

        <!-- Vehicle Management -->
        <li class="nav-item mb-2 <%= !sidebar.vehicleManagement ? 'd-none' : '' %>">
            <a class="nav-link d-flex justify-content-between align-items-center" data-bs-toggle="collapse"
                href="#vehcileManagement" role="button">
                <span><i class="bi bi-building me-2"></i> Vehicle Management</span>
                <i class="bi bi-chevron-down"></i>
            </a>
            <ul class="collapse list-unstyled ps-3" id="vehcileManagement">
                <li class="sub-item <%= !sidebar.manageServices ? 'd-none' : '' %>">
                    <a href="/service/serviceManagement" class="nav-link sub-link"><i
                            class="bi bi-boxes me-2"></i>Service Management</a>
                </li>
                <li class="sub-item <%= !sidebar.manageVehicles ? 'd-none' : '' %>">
                    <a href="/vehicle/vehcileManagement" class="nav-link sub-link"><i
                            class="bi bi-boxes me-2"></i>Manage Vehicle</a>
                </li>
            </ul>
        </li>

        <!-- Vendor Management -->
        <li class="nav-item mb-2 <%= !sidebar.vendorManagement ? 'd-none' : '' %>">
            <a href="/vendor/vendorManagement" class="nav-link"><i class="bi bi-patch-question me-2"></i>Vendor
                Management</a>
        </li>

        <!-- FAQ Management -->
        <li class="nav-item mb-2 <%= !sidebar.faqManagement ? 'd-none' : '' %>">
            <a href="/faq/faqManagement" class="nav-link"><i class="bi bi-patch-question me-2"></i>Faq Management</a>
        </li>

        <!-- Logout -->
        <li class="nav-item mt-4">
            <a href="/logout" class="nav-link text-danger"><i class="bi bi-box-arrow-right me-2"></i>Logout</a>
        </li>
    </ul>
</div>