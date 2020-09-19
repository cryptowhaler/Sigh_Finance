<template>
  <div class="support">
    <div
      v-if="!mobileMenu"
      :class="['support-content', !noIcon ? 'with-icon' : 'without-icon']"
      @click="showModal"
    >
      <div v-if="!noIcon" class="support-icon">
        <img :alt="help_center" style="padding-left: 42px;" src="~@/assets/images/help-center.svg"/>
      </div>
      <div v-if="!noIcon" class="support-label">
        <h5 style="color: black">{{customer_support}}</h5>
      </div>
      <p v-else>{{customer_support}}</p>
    </div>
    <div v-if="mobileMenu" class="mobile-menu" @click="showModal">
      {{customer_support}}
    </div>
    <b-modal
      ref="emailPrefill"
      :title="issue_info"
      hide-footer
      centered
      class="bootstrap-modal nopadding"
      static
      lazy
    >
      <div class="email-prefill-inputs">
        <input v-model="browser" :placeholder="browser_placeholder" />
        <input v-model="os" :placeholder="os_placeholder" />
        <input v-model="device" :placeholder="device_placeholder" />
        <input v-model="address" :placeholder="address_placeholder" />
        <input v-model="url" :placeholder="url_placeholder" />
        <textarea v-model="description" :placeholder="description_placeholder" />
        <a
          :href="issueLinkOut"
          target="_blank"
          rel="noopener noreferrer"
          class="mid-round-button-green-filled"
          style="color: white; width: fit-content; align-self: center; "
        >
          {{send_}}
        </a>
      </div>
    </b-modal>
  </div>
</template>

<script>
import xss from 'xss';
import platform from 'platform';

export default {
  props: {
    mobileMenu: {
      type: Boolean,
      default: false
    },
    noIcon: {
      type: Boolean,
      default: false
    },
    show: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      browser: '',
      os: '',
      device: '',
      url: '',
      description: '',
      address: '',

      issue_info: 'Issue information',

      browser_placeholder : 'Browser',
      os_placeholder: 'Operating System',
      device_placeholder: 'Device/Wallet type (If any)',
      url_placeholder: 'Url',
      description_placeholder: 'Describe the issue',
      address_placeholder: 'Wallet PUBLIC address (If any)',
      help_center: "Help Center",
      customer_support : "Customer Support",
      send_ : "Send"

    };
  },
  computed: {
    issueLinkOut() {
      const subject = `Issue on ${this.url}`;
      const body =
        'Browser: ' +
        this.browser +
        ', \n' +
        'Os: ' +
        this.os +
        ', \n' +
        'Device: ' +
        this.device +
        ',\n' +
        'url: ' +
        this.url +
        ', \n' +
        'Wallet Address: ' +
        this.address +
        ',' +
        '\n\n' +
        this.description;
      // eslint-disable-next-line
      return `mailto:contact@sigh.finance?subject=${encodeURIComponent(this.stripTags(subject))}&body=${encodeURIComponent(this.stripTags(body))}`;
    }
  },

  watch: {
    show() {
      this.showModal();
    }
  },

  mounted() {
    this.browser = platform.name;
    this.os = platform.os.family;
    this.device = platform.product;
    this.url = this.$router.history.current.fullPath;
  },

  methods: {
    showModal() {
      this.$refs.emailPrefill.show();
    },
    stripTags (content) {
      const insertToDom = new DOMParser().parseFromString(content, 'text/html');
      const textContent = insertToDom && insertToDom.body ? insertToDom.body.textContent.replace(/(<([^>]+)>)/gi, '') : '';
      const string = xss(textContent, { whitelist: [], stripIgnoreTag: true, stripIgnoreTagBody: '*'});
      return string;
    }

  }
};
</script>

<style lang="scss" scoped>
@import 'CustomerSupport.scss';

.mobile-menu {
  font-size: 20px;
  font-weight: 500;
}
</style>
