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

// Модальное окно имзменения компа
const editModal = document.querySelector('#editModal')
let editPcId = null
const rename = document.querySelector('#nameEdit')
const remac = document.querySelector('#macEdit')
const confirmEdit = document.querySelector('#submitEdit')
const cancelEdit = document.querySelector('#cancelEdit')

// Изменить данные пользователя
const editUd = document.querySelector('#editUserData')

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
        if (!Array.isArray(pcs)) {
            throw new Error("Список компов испорчен");
        }

        let hasId = true
        pcs.forEach((pc, index) => {
            if (!pc.id) {
                pc.id = index + 1
                hasId = false
            }
        })

        if (!hasId) {
            cachePCS(pcs)
        }

        PCs = pcs
    } catch (error) {
        console.error(error.message)
        PCs = []
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
                                <button class="turn-btn" data-id="${pc.id || PCs.indexOf(pc) + 1}">🔴</button>
                            </div>`
                const deleteBtn = li.querySelector('.delete-btn')
                const turnBtn = li.querySelector('.turn-btn')

                deleteBtn.addEventListener('click', () => {
                    deletePc(pc.id)
                })
                turnBtn.addEventListener('click', async () => { 
                    const result = await turnPc(pc.mac) 
                    if (! result) {
                        return
                    }
                    turnBtn.textContent = '🟢'
                })

                li.addEventListener('click', (e) => {
                    if (e.target === deleteBtn || e.target === turnBtn) return
                    editModal.classList.add('active')
                    editPcId = pc.id
                    rename.value = PCs[editPcId - 1].name
                    remac.value = PCs[editPcId - 1].mac
                })

                pcList.appendChild(li)
            })
    } else {
        pcList.innerHTML = '<li class="empty-li">Пусто</li>'
    }
}

// Удаление компа
function deletePc(id) {
    const deletablePC = PCs.find(pc => pc.id === id)
    if (!deletablePC) {
        return
    }
    PCs = PCs.filter(pc => {
        return pc !== deletablePC
    })
    cachePCS(PCs)
    renderPC()
}

// Вкдючение компа
async function turnPc(mac) {
    try {
        const res = await fetch(`https://${ip}:${port}/wake`, {
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
        renderPC()
    }
}

function init() {
    getUserDataFromCache()
    getPCsFromCache()
    updateUI()
    renderPC()
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
        id: PCs.length + 1,
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

confirmEdit.addEventListener('click', () => {
    const newName = rename.value
    const newMac = remac.value
    
    remac.style.borderColor = ''
    rename.style.borderColor = ''

    let hasError = false

    if (!newName) {
        rename.style.borderColor = 'var(--danger)'
        hasError = true
    }
    if (!newMac) {
        remac.style.borderColor = 'var(--danger)'
        hasError = true
    }

    PCs.forEach(pc => {
        if (pc.name === newName && pc.id !== editPcId) {
            rename.style.borderColor = 'var(--danger)'
            hasError = true
        }
        if (pc.mac === newMac && pc.id !== editPcId) {
            remac.style.borderColor = 'var(--danger)'
            hasError = true
        }
    })

    if (hasError) return

    editPc({
        id: editPcId,
        name: newName,
        mac: newMac
    })
    remac.style.borderColor = ''
    rename.style.borderColor = ''
    editModal.classList.remove('active')
})

cancelEdit.addEventListener('click', () => {
    editModal.classList.remove('active')
    rename.value = ''
    remac.value = ''
})

function editPc(newData){
    if (typeof newData === 'object' && newData.name && newData.id && newData.mac){
        const id = newData.id
        PCs[id - 1] = newData
        cachePCS(PCs)
        renderPC()
    }
}

editUd.addEventListener('click', () => {
    register.classList.remove('hidden')
    ipInp.value = ip
    portInp.value = port
})








init()
