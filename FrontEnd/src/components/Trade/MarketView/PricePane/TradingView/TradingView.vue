// <template src="./template.html"></template>

<script>
import ExchangeDataEventBus from '@/eventBuses/exchangeData';
export default {
  name: 'trading-view',
  data() {
    return {
      bitmexPathVariable: 'https://bitmex.blocknomic.com/index.html?symbol=TSLA&exchange=bitfinex',
    };
  },

  mounted() {
  },

  methods: {
  },

  destroyed() {
    ExchangeDataEventBus.$emit('unsubscribe-candles');
    ExchangeDataEventBus.$off('snapshotCandles');
  },
};
</script>


<style lang="scss" src="./style.scss" scoped></style>
