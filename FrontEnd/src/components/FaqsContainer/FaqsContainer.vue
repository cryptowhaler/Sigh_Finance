<template>
  <div class="faqs">
    <div id="faqs" class="wrap" style="background-color: white">
      <div class="page-container">
        <div class="flex-col-vertical-bottom top-title">
          <div class="title">
            <h2 style="color: black; font-weight: 500; font-size: 42px;"> FAQs </h2>
            <!-- <h5>
              {{ $t('home.faqs.subtitle') }}
              <a
                target="_blank"
                rel="noopener noreferrer"
                href="https://kb.myetherwallet.com/"
              >
                {{ $t('home.faqs.button-see-more') }}
              </a>
            </h5> -->
          </div>
          <customer-support />
        </div>

        <div class="qa-cards">
          <ul class="qa__contents">
            <li v-for="prop in Object.keys(faqs)" :key="prop">
              <!--  Heading and open button for each FAQ -->
              <div class="qa__contents--title" @click="openFAQ(prop)">
                <h3 style="color: black; font-weight: 500; font-size: 24px;"> {{faqs[prop].title}} </h3>
                <div class="show-more-buttons">
                  <div :class=" faqs[prop].open ? 'faq-open' : '' " class="animated-button">
                    <div class="bar bar1"></div>
                    <div class="bar bar2"></div>
                  </div>
                </div>
              </div>
              <!-- Content which is displayed when the tab is opened for each FAQ -->
              <div :class="faqs[prop].open ? 'faq-open' : ''" class="qa__contents--content" >
                <div class="qa-text" style="color: black; font-weight: 240; font-size: 17px;">
                  <div class="content">
                    {{faqs[prop].content}}
                    <div v-if="faqs[prop].issubcontentAvailable" > 
                      <br>
                      {{faqs[prop].subcontent1}}
                      <br>
                      {{faqs[prop].subcontent2}}
                      <br>
                      {{faqs[prop].subcontent3}}
                      <br>
                      {{faqs[prop].subcontent4}}
                      <br> <br>
                      {{faqs[prop].subcontent5}}
                    </div>
                  </div>
                   <!-- {{faqs[prop].content}} -->
                  <a :href="faqs[prop].link" target="_blank" rel="noopener noreferrer">
                    {{ faqs[prop].linkText }}
                  </a>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import CustomerSupport from '@/components/CustomerSupport';
export default {
  components: {
    'customer-support': CustomerSupport
  },
  data() {
    return {
      faqs: {
        faq1: {
          open: false,
          title: 'What is SIGH Finance?',
          content: 'SIGH Finance is a money-market protocol allowing Institutional Investors to invest in DIAs (tokenized basket of crypto assets) and earn additional lending interest by allowing it to be borrowed by the borrowers in the market.',
          issubcontentAvailable: true,
          subcontent1: '1. The inflationary SIGH token is distributed through an Engineered liquidity mining pipeline controlled by A.I models which performs the following tasks :- ',
          subcontent2: ' --> It tries to minimize losses (if any) accured by the investors on a daily basis due to the inherent volatility of the underlying crypto assets by adjusting SIGH distribution rate across supported DIAs and individual markets.',
          subcontent3: ' -->  It uses the protocol\'s collected fee and SIGH\'s inflationary supply to buy yield generating crypto assets (WBTC/WETH/LINK/SIGH tokens) and deposits them in the protocol\'s treasury.',
          subcontent4: ' --> The treasury amount is then used to buy SIGH tokens from the market which are then redistributed among the investors in-case of loss.',
          subcontent5:' 2. Decisions regarding the use of the treasury and the SIGH\'s distribution mechanism can be decided upon through community governance by voting with GSIGH, the governance coin of the protocol. ',
          // linkText: 'home.faqs.button-learn-more',
          // link: 'https://kb.myetherwallet.com/en/mewwallet/mewwallet-user-guide/'
        },
        faq2: {
          open: false,
          title:  'What Problems are we addressing?',   // 'home.faqs.LiquiTrade.title',
          content: 'We are providing Investors an opportunity to make investments within the crypto space which are optimized for maximum risk adjusted returns by addressing the inherent volatility of individual crypto assets, which will increase adoption and bring more sophistication to the existing crypto space.',   // 'home.faqs.LiquiTrade.text',
          issubcontentAvailable: false,
          subcontent: [],
          // linkText: 'home.faqs.button-here',
          // link: 'https://mewconnect.myetherwallet.com/'
        },
        faq3: {
          open: false,
          title: 'What Innovation are we bringing in?',   // 'home.faqs.privateEquity.title',
          content: 'Through SIGH Finance we are creating an \'Algorithmic Banking protocol\' with an interest rate model which is backed by A.I driven quantitative modelling  techniques inherently addressing the inherent volatility of the crypto markets to allow for Institutional Capital to be brought into the space. ',   // 'home.faqs.privateEquity.text',
          issubcontentAvailable: false,
          subcontent: [],
          // linkText: 'home.faqs.button-here',
          // link:'https://kb.myetherwallet.com/getting-started/accessing-your-new-eth-wallet.html'
        },
        faq4: {
          open: false,
          title: 'Tell me more about your research Initiative.',   // 'home.faqs.privateEquity.title',
          content: 'SIGH Finance is part of a research project being undertaken with a single goal which is to develop and document different kind of tokenized incentive structures and value distribution driven econometric models and quantitative analysis techniques along with and other engineered financial products driven by A.I on the DLT Infrastructure.',   // 'home.faqs.privateEquity.text',
          issubcontentAvailable: false,
          subcontent: [],
          // linkText: 'home.faqs.button-here',
          // link:'https://kb.myetherwallet.com/getting-started/accessing-your-new-eth-wallet.html'
        },
        // faq5: {
        //   open: false,
        //   title: 'test1',   // 'home.faqs.securityTokens.title',
        //   content: ['test1'],   // 'home.faqs.securityTokens.text',
        //   issubcontentAvailable: false,
        //   subcontent: [],
          // linkText: 'home.faqs.button-here',
          // link:'https://kb.myetherwallet.com/transactions/how-to-send-transaction.html'
        // },
        // faq5: {
        //   open: false,
        //   title: 'home.faqs.spaceEconomy.title',
        //   content: 'home.faqs.spaceEconomy.text',
        //   // linkText: 'home.faqs.button-here',
        //   // link:'https://kb.myetherwallet.com/private-keys-passwords/lost-eth-private-key.html'
        // },
        // faq6: {
        //   open: false,
        //   title: 'home.faqs.spaceTechPlans.title',
        //   content: 'home.faqs.spaceTechPlans.text',
        //   // linkText: 'home.faqs.button-here',
        //   // link:'https://kb.myetherwallet.com/getting-started/creating-a-new-wallet-on-myetherwallet.html'
        // }
      }
    };
  },
  methods: {
    openFAQ: function (faqToOpen) {
      this.faqs[faqToOpen].open = !this.faqs[faqToOpen].open;
    }
  }
};
</script>

<style lang="scss" scoped>
@import 'FaqsContainer.scss';
</style>
