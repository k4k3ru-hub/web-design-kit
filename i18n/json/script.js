//
// script.js
//


//
// Class
//
class I18nJson {

	static IsLoading = false;

	//
	//	Constructor
	//
	//	@param:
	//		langCodeUrlMapList: array:
	//			[
	//				{
	//					langCode: 'en',
	//					url: '/i18n/en.json'
	//				},
	//				{
	//					langCode: 'ja',
	//					url: '/i18n/ja.json'
	//				}
	//			]
	//		timestamp: string: 2022102356012
	//
	constructor(langCodeUrlMapList, timestamp = null) {
		this.langCodeUrlMapList = langCodeUrlMapList;
		this.timestamp = timestamp;
		this.lsKeyPrefix = 'I18n.';
		this.lsKeyDate = this.lsKeyPrefix + 'date';
		this.lsExpiresDate = 3;
		this.sleepMS = 300;
		this.sleepCnt = 5;
		this.Strings = {};

		// Start loading.
		this.load();
	}


	//
	// Get localized string
	//
	String(langCode, key, defaultVal = key) {
		if(this.Strings[langCode] == null) {
			return defaultVal;
		}

		const keys = key.split('.');
		let value;
		for(let i = 0; i < keys.length; i++) {
			const k = keys[i];
			if(i === 0) {
				if(this.Strings[langCode][k] == null || this.Strings[langCode][k] === '') {
					return defaultVal;
				} else {
					value = this.Strings[langCode][k];
				}
			} else {
				if(value[k] == null || value[k] === '') {
					return defaultVal;
				} else {
					value = value[k];
				}
			}
		}
		return value;
	}


	//
	// Get localized string asynchronously
	//
	async StringAsync(langCode, key, defaultVal = key) {
		// Check if it has been loading JSON file or not.
		await this.queuing();

		return this.String(langCode, key, defaultVal);
	}


	//
	// HTTP GET request
	//
	getRequest(langCode, url) {
		return new Promise((resolve, reject) => {
			let lsDateVal;
			if(this.timestamp !== null) {
				lsDateVal = this.timestamp.toString();
			} else {
				const val = new Date();
				val.setDate(val.getDate() + this.lsExpiresDate);
				lsDateVal = val.toString();
			}
			const xhr = new XMLHttpRequest();
			xhr.open('GET', url);
			xhr.onload = () => {
				if(xhr.status >= 200 && xhr.status < 300) {
					const resJson = JSON.parse(xhr.responseText);
					if(resJson !== undefined && resJson !== null) {
						this.Strings[langCode] = resJson;
						window.localStorage.setItem(this.lsKeyPrefix + langCode, JSON.stringify(resJson));
						window.localStorage.setItem(this.lsKeyDate, lsDateVal);
						resolve();
					} else {
						reject('Invalid a json file. url: ' + url);
					}
				} else {
					reject(xhr.status + ' ' + xhr.statusText);
				}
			};
			xhr.onerror = () => reject(xhr.status + ' ' + xhr.statusText);
			xhr.send();
		});
	}


	//
	// Load
	//
	async load(langCodeUrlMapList) {
		// Check if it has been loading JSON file or not.
		await this.queuing();

		// Check if it has been loaded in the local storage or not.
		const lsValDateStr = window.localStorage.getItem(this.lsKeyDate);
		const lsValDate = new Date(window.localStorage.getItem(this.lsKeyDate));
		const now = new Date();
		if((this.timestamp !== null && this.timestamp === lsValDateStr) || now.getTime() < lsValDate.getTime()) {
			for(let i = 0; i < this.langCodeUrlMapList.length; i++) {
				const langCode = this.langCodeUrlMapList[i].langCode;
				const s =  window.localStorage.getItem(`${this.lsKeyPrefix}${langCode}`);
				if(s === undefined || s === null) {
					continue;
				}
				this.Strings[langCode] = JSON.parse(s);
			}
			return;
		}

		// HTTP GET request.
		try {
			for(let i = 0; i < this.langCodeUrlMapList.length; i++) {
				const map = this.langCodeUrlMapList[i];
				await this.getRequest(map['langCode'], map['url']);
			}
		} catch(err) {
			throw new Error(err);
		} finally {
			I18nJson.IsLoading = false;
		}
	}


	//
	// Queuing
	//
	async queuing() {
		if(I18nJson.IsLoading) {
			for(let i = 0; i < this.sleepCnt; i++) {
				await this.timer();
				if(!I18nJson.IsLoading) {
					break;
				}
			}
		} else {
		    I18nJson.IsLoading = true;
		}
	}


	//
	// Timer
	//
	timer() {
		return new Promise(resolve => setTimeout(resolve, this.sleepMS));
	}

}
export { I18nJson };
