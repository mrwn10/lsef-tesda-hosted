// Password validation function
function validatePassword(password) {
    const hasMinLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return {
        valid: hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial,
        hasMinLength,
        hasUpper,
        hasLower,
        hasNumber,
        hasSpecial
    };
}

// Password input event listeners
function setupPasswordValidation() {
    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirm_password');
    
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            const validation = validatePassword(this.value);
            
            // Update requirement indicators
            document.getElementById('req-length').classList.toggle('valid', validation.hasMinLength);
            document.getElementById('req-upper').classList.toggle('valid', validation.hasUpper);
            document.getElementById('req-lower').classList.toggle('valid', validation.hasLower);
            document.getElementById('req-number').classList.toggle('valid', validation.hasNumber);
            document.getElementById('req-special').classList.toggle('valid', validation.hasSpecial);
            
            // Check password match if confirm has value
            if (confirmInput.value) {
                checkPasswordMatch();
            }
        });
    }
    
    if (confirmInput) {
        confirmInput.addEventListener('input', checkPasswordMatch);
    }
}

function checkPasswordMatch() {
    const password = document.getElementById('password').value;
    const confirm = document.getElementById('confirm_password').value;
    const matchIndicator = document.getElementById('password-match');
    
    if (password && confirm) {
        if (password === confirm) {
            matchIndicator.textContent = 'Passwords match';
            matchIndicator.className = 'hint valid';
        } else {
            matchIndicator.textContent = 'Passwords do not match';
            matchIndicator.className = 'hint error';
        }
    }
}

// Location Selector Module
const LocationSelector = (function() {
    // Cache DOM elements
    const provinceSelect = document.getElementById("province");
    const municipalSelect = document.getElementById("municipal");
    const barangaySelect = document.getElementById("barangay");
    const registrationForm = document.getElementById("registrationForm");
    
    // Create hidden inputs for form submission
    const hiddenProvince = document.createElement("input");
    hiddenProvince.type = "hidden";
    hiddenProvince.name = "province";
    hiddenProvince.id = "hidden_province";
    registrationForm.appendChild(hiddenProvince);

    const hiddenMunicipal = document.createElement("input");
    hiddenMunicipal.type = "hidden";
    hiddenMunicipal.name = "municipal";
    hiddenMunicipal.id = "hidden_municipal";
    registrationForm.appendChild(hiddenMunicipal);

    const hiddenBarangay = document.createElement("input");
    hiddenBarangay.type = "hidden";
    hiddenBarangay.name = "barangay";
    hiddenBarangay.id = "hidden_barangay";
    registrationForm.appendChild(hiddenBarangay);

    // API Configuration
    const API_CONFIG = {
        baseUrls: {
            psgc: "https://psgc.gitlab.io/api",
            buonzz: "https://ph-locations-api.buonzz.com/v1",
            lguplus: "https://api.lguplus.com.ph/psgc"
        },
        endpoints: {
            provinces: {
                psgc: "/provinces/",
                buonzz: "/provinces",
                lguplus: "/provinces"
            },
            municipalities: {
                psgc: (code) => `/provinces/${code}/cities-municipalities/`,
                buonzz: (code) => `/provinces/${code}/cities`,
                lguplus: (code) => `/provinces/${code}/cities`
            },
            barangays: {
                psgc: (code) => `/cities-municipalities/${code}/barangays/`,
                buonzz: (code) => `/cities/${code}/barangays`,
                lguplus: (code) => `/cities/${code}/barangays`
            },
            ncrCities: "/regions/130000000/cities-municipalities/"
        },
        fallbackOrder: ['psgc', 'buonzz', 'lguplus']
    };

    // Helper functions
    function clearOptions(selectElement, placeholder) {
        selectElement.innerHTML = `<option value="">${placeholder}</option>`;
        selectElement.disabled = selectElement.id === "province" ? false : true;
    }

    function showLoading(selectElement) {
        const loadingOption = document.createElement("option");
        loadingOption.text = "Loading...";
        loadingOption.disabled = true;
        selectElement.appendChild(loadingOption);
        selectElement.disabled = true;
    }

    function showError(selectElement, message) {
        clearOptions(selectElement, message);
        selectElement.disabled = false;
    }

    function sortByName(a, b) {
        return a.name.localeCompare(b.name);
    }

    // API Fetch Functions
    async function fetchData(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error(`Failed to fetch ${url}:`, error);
            throw error;
        }
    }

    async function fetchWithFallbacks(endpointType, ...args) {
        for (const api of API_CONFIG.fallbackOrder) {
            try {
                let url;
                if (typeof API_CONFIG.endpoints[endpointType][api] === 'function') {
                    url = API_CONFIG.baseUrls[api] + API_CONFIG.endpoints[endpointType][api](...args);
                } else {
                    url = API_CONFIG.baseUrls[api] + API_CONFIG.endpoints[endpointType][api];
                }
                return await fetchData(url);
            } catch (error) {
                console.log(`Attempt failed with ${api} API, trying next...`);
                continue;
            }
        }
        throw new Error("All API endpoints failed");
    }

    // Data Loading Functions
    async function loadProvinces() {
        showLoading(provinceSelect);
        
        try {
            const provinces = await fetchWithFallbacks('provinces');
            
            // Check if NCR is included
            const hasNCR = provinces.some(p => p.name.includes("National Capital Region"));
            if (!hasNCR) {
                // Add NCR if missing
                provinces.push({
                    code: "130000000",
                    name: "Metro Manila (NCR)",
                    isRegion: true
                });
            }

            clearOptions(provinceSelect, "Select Province");
            provinces.sort(sortByName).forEach(province => {
                const option = document.createElement("option");
                option.value = province.name;
                option.dataset.code = province.code || province.id;
                option.dataset.isRegion = province.isRegion || province.name.includes("NCR");
                option.text = province.name;
                provinceSelect.appendChild(option);
            });
            
            provinceSelect.disabled = false;
        } catch (error) {
            showError(provinceSelect, "Error loading provinces");
            console.error("Failed to load provinces:", error);
        }
    }

    async function loadMunicipalities(provinceData) {
        showLoading(municipalSelect);
        
        try {
            let municipalities;
            
            if (provinceData.isRegion) {
                // Special handling for NCR
                const url = API_CONFIG.baseUrls.psgc + API_CONFIG.endpoints.ncrCities;
                municipalities = await fetchData(url);
            } else {
                // Regular provinces
                municipalities = await fetchWithFallbacks('municipalities', provinceData.code);
            }

            clearOptions(municipalSelect, "Select City/Municipality");
            municipalities.sort(sortByName).forEach(municipality => {
                const option = document.createElement("option");
                option.value = municipality.name;
                option.dataset.code = municipality.code || municipality.id;
                option.text = municipality.name;
                municipalSelect.appendChild(option);
            });
            
            municipalSelect.disabled = false;
        } catch (error) {
            showError(municipalSelect, "Error loading cities");
            console.error("Failed to load municipalities:", error);
        }
    }

    async function loadBarangays(cityCode) {
        showLoading(barangaySelect);
        
        try {
            const barangays = await fetchWithFallbacks('barangays', cityCode);
            
            clearOptions(barangaySelect, "Select Barangay");
            barangays.sort(sortByName).forEach(barangay => {
                const option = document.createElement("option");
                option.value = barangay.name || barangay.brgy_name;
                option.text = barangay.name || barangay.brgy_name;
                barangaySelect.appendChild(option);
            });
            
            barangaySelect.disabled = false;
        } catch (error) {
            showError(barangaySelect, "Error loading barangays");
            console.error("Failed to load barangays:", error);
        }
    }

    // Event Handlers
    function handleProvinceChange() {
        const selectedValue = this.value;
        clearOptions(municipalSelect, "Select City/Municipality");
        clearOptions(barangaySelect, "Select Barangay");
        
        if (!selectedValue) {
            hiddenProvince.value = "";
            hiddenMunicipal.value = "";
            hiddenBarangay.value = "";
            return;
        }

        const selectedOption = this.options[this.selectedIndex];
        hiddenProvince.value = selectedValue;
        loadMunicipalities({
            code: selectedOption.dataset.code,
            name: selectedValue,
            isRegion: selectedOption.dataset.isRegion === "true"
        });
    }

    function handleMunicipalChange() {
        const selectedValue = this.value;
        clearOptions(barangaySelect, "Select Barangay");
        
        if (!selectedValue) {
            hiddenMunicipal.value = "";
            hiddenBarangay.value = "";
            return;
        }

        const selectedOption = this.options[this.selectedIndex];
        hiddenMunicipal.value = selectedValue;
        loadBarangays(selectedOption.dataset.code);
    }

    function handleBarangayChange() {
        hiddenBarangay.value = this.value || "";
    }

    // Initialize
    function init() {
        if (!provinceSelect || !municipalSelect || !barangaySelect) return;
        
        municipalSelect.disabled = true;
        barangaySelect.disabled = true;

        // Set up event listeners
        provinceSelect.addEventListener("change", handleProvinceChange);
        municipalSelect.addEventListener("change", handleMunicipalChange);
        barangaySelect.addEventListener("change", handleBarangayChange);

        // Initial load
        loadProvinces();
        setupPasswordValidation();
    }

    // Public API
    return {
        init
    };
})();

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
    LocationSelector.init();
    
    // Notification function
    function showNotification(message, type) {
        const notification = document.createElement("div");
        notification.className = `notification show ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.remove("show");
            setTimeout(() => {
                notification.remove();
            }, 500);
        }, 5000);
    }
});