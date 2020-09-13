class LocalStorage {
  set(key, data) {
    return window.localStorage.setItem(key, data);
  }

  get(key) {
    return window.localStorage.getItem(key);
  }

  remove(key) {
    return window.localStorage.removeItem(key);
  }

  removeAll() {
    return window.localStorage.clear();
  }

  isUserLoggedIn() {
    return false;
  }

  clearLoginUserData() {
    this.remove(Keys.jwtToken);
    this.remove(Keys.expTime);
    this.remove(Keys.refreshToken);
    this.remove(Keys.idToken);
    this.remove(Keys.username);
    this.remove(Keys.mqtt);
  }

  clearVegaSession() {
    VegaKeys.token = null;
    VegaKeys.name = null;
    VegaKeys.pubKeys = [];
    VegaKeys.currentActiveKey =null;
    this.remove(VegaKeys.name);
    this.remove(VegaKeys.token);
    this.remove(VegaKeys.pubKeys);
    this.remove(VegaKeys.currentActiveKey);
  }
}

export default new LocalStorage();

export const VegaKeys = {
  token: null,
  name: null,
  pubKeys: [],
  currentActiveKey:null,
};


export const Keys = {
  jwtToken: 'jwt',
  expTime: 'expT',
  refreshToken: 'refreshT',
  idToken: 'idT',
  username: 'usnn',
  pingUuid: 'sth',
  mqtt: 'mqtt',
};
