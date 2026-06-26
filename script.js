// Регистрация
const ipInp = document.querySelector('#ip')
const portInp = document.querySelector('#port')
const register = document.querySelector('#register-modal')
const enter = document.querySelector('#enter')

// Список компов
const addPC = document.querySelector('#addBtn')
const pcList = document.querySelector('#pcList')

// Консоль
const cons = document.querySelector('#outputMessage')

// Модалка добавления
const addModal = document.querySelector('#addModal')
const nameInp = document.querySelector('#name')
const macInp = document.querySelector('#mac')
const submit = document.querySelector('#submit')

// Стереть все данные
const clear = document.querySelector('#reset')

// Переменные
let PCs = []
let ip = ''
let port = ''
let isRegistered = false

// Кэш-ключи
const CACHE_PCS = 'pcawake_cache_pclist'
const CACHE_USERDATA = 'psawake_cache_userdata'



// получение из кэша пользовательской информации
function getUserDataFromCache() {
    try {
        const UD_UNCACHED = localStorage.getItem(CACHE_USERDATA)
        if (!UD_UNCACHED) {
            throw new Error("Данные авторизации не закэшированы");
        }
        const ud = JSON.parse(UD_UNCACHED)
        if (typeof ud === 'object' && ud.ip && ud.port) {
            ip = ud.ip
            port = ud.port
            isRegistered = true
            return
        }
        throw new Error("Данные авторизации испорчены");
    } catch (error) {
        console.error(error.message)
        localStorage.removeItem(CACHE_USERDATA)
    }
}

// Кэшируем пользовательскую информацию
function cacheUserData(ud) {
    localStorage.setItem(CACHE_USERDATA, JSON.stringify(ud))
    isRegistered = true
}

// Получения из кэша список компьютеров пользователя
function getPCsFromCache() {
    try {
        const PCS_UNCACHED = localStorage.getItem(CACHE_PCS)
        if (!PCS_UNCACHED) {
            throw new Error("Список компов не закэширован");
        }
        const pcs = JSON.parse(PCS_UNCACHED)
        if (Array.isArray(pcs)) {
            PCs = pcs
            return
        }
        throw new Error("Список компов испорчен");
    } catch (error) {
        console.error(error.message)
    }
}

// Кэширование компьютеров
function cachePCS(p) {
    localStorage.setItem(CACHE_PCS, JSON.stringify(p))
}

// Обновление UI
function updateUI() {
    if (isRegistered) {
        register.classList.add('hidden')
    } else {
        register.classList.remove('hidden')
    }
}

// Рендер компов
function renderPC() {
    pcList.innerHTML = ''
    if (PCs.length !== 0 && Array.isArray(PCs)) {
            PCs.forEach(pc => {
            const li = document.createElement('li')
            li.innerHTML = `
                        <div class="pc-meta">
                            <span class="img">🖥️</span>
                            <div class="pc-info">
                                <span class="pc-name">${pc.name}</span>
                                <span class="pc-mac">${pc.mac}</span>
                            </div>
                        </div>
                        <div class="pc-btns">
                            <button class="delete-btn btn">🗑️</button>
                            <button class="turn-btn" data-mac="${pc.mac}">🔴</button>
                        </div>`
            const deleteBtn = li.querySelector('.delete-btn')
            const turnBtn = li.querySelector('.turn-btn')

            deleteBtn.addEventListener('click', () => {
                li.remove()
                deletePc(pc.mac)
            })
            turnBtn.addEventListener('click', async () => { 
                const result = await turnPc(pc.mac) 
                if (! result) {
                    return
                }
                turnBtn.textContent = '🟢'
            })

            pcList.appendChild(li)
        })
    } else {
        pcList.innerHTML = '<li class="empty-li">Пусто</li>'
    }
}

// Удаление компа
function deletePc(mac) {
    const deletablePC = PCs.find(pc => pc.mac === mac)
    if (!deletablePC) {
        return
    }
    PCs = PCs.filter(pc => {
        pc.mac !== mac
    })
    cachePCS(PCs)
    getPCsFromCache()
    renderPC()
}

// Вкдючение компа
async function turnPc(mac) {
    try {
        const res = await fetch(`http://${ip}:${port}/wake`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({mac: mac})
        })
         
        if (!res.ok) {
            throw new Error(res.statusText);
        }

        const data = await res.json()

        if (data.status !== "success") {
            throw new Error(data.message);
        }

        cons.textContent = `Отправлен магический пакет компьютеру ${mac}` 
        cons.classList.add('success')
        cons.classList.remove('error')

        return true
    } catch (error) {
        console.error(error)
        cons.textContent = error
        cons.classList.add('error')
        cons.classList.remove('success')

        return false
    }
}

// Добавить пк
function addingPC(pc) {
    if (typeof pc === 'object' && pc.name && pc.mac) {
        PCs.push(pc)
        cachePCS(PCs)
        getPCsFromCache()
        renderPC()
    }
}

function init() {
    getUserDataFromCache()
    getPCsFromCache()
    updateUI()
}




enter.addEventListener('click', () => {
    ipInp.style.border = ''
    portInp.style.border = ''

    const currIp = ipInp.value
    const currPort = portInp.value

    let hasError = false

    if (!currIp) {
        ipInp.style.border = '1px solid var(--danger)'
        hasError = true
    }
    if (!currPort) {
        portInp.style.border = '1px solid var(--danger)'
        hasError = true
    }

    if (hasError) return

    isRegistered = true
    cacheUserData({
        ip: currIp,
        port: currPort
    })

    ipInp.value = ''
    portInp.value = ''

    getUserDataFromCache()
    updateUI()
})

addPC.addEventListener('click', () => {
    addModal.classList.add('active')
})

addModal.addEventListener('click', (e) => {
    if (e.target === addModal) {
        addModal.classList.remove('active')
    }
})

submit.addEventListener('click', () => {
    nameInp.style.border = ''
    macInp.style.border = ''

    const currName = nameInp.value
    const currMac = macInp.value

    let hasError = false

    if (!currMac) {
        macInp.style.border = '1px solid var(--danger)'
        hasError = true
    } 
    if (!currName) {
        nameInp.style.border = '1px solid var(--danger)'
        hasError = true
    }

    PCs.forEach(pc => {
        if (pc.name === currName) {
            nameInp.style.border = '1px solid var(--danger)'
            hasError = true
        }
        if (pc.mac === currMac) {
            macInp.style.border = '1px solid var(--danger)'
            hasError = true
        }
    })

    if (hasError) return

    addingPC({
        name: currName,
        mac: currMac
    })

    nameInp.value = ''
    macInp.value = ''

    addModal.classList.remove('active')
})

clear.addEventListener('click', () => {
    localStorage.removeItem(CACHE_PCS)
    localStorage.removeItem(CACHE_USERDATA)

    PCs = []
    ip = ''
    port = ''
    isRegistered = false

    renderPC()
    updateUI()
})











init()