<template src="./template.html"></template>

<script>
import Spinner from '@/components/Spinner/Spinner.vue';
import EventBus, { EventNames, } from '@/eventBuses/default';
import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import ModalBox from '@/components/ModalBox/ModalBox.vue';

import FAQs from '@/components/FaqsContainer';

export default {
  name: 'mainPage',

  components: {
    Spinner,
    ModalBox,
    faqs: FAQs,
  },

  props: {
    parentHeight: Number,

  },

  data() {
    return {
      martianDate: '',
      martianTime: '',
      contactModalShown: false,

    };
  },

  // computed: {
  //   positions() {
  //     return this.mapActiveOrders(this.$store.getters.positions);
  //   },
  // },



  mounted() {
    this.interval = setInterval(() => {
      this.showDate();
    },1000);
    
    this.showDate();

    // EventBus.$on('show-contact-modal', this.toggleContactModal());           //AUTH
  },

  methods: {

    toggleContactModal() {   //ADDED
      // console.log(this.contactModalShown);    
      this.contactModalShown = !this.contactModalShown;
      // console.log(this.contactModalShown);        
    },

         h_to_hms(h) {                  //Converts hours to proper format - 
            let x = h * 3600;
            let hh = Math.floor(x / 3600);
            if (hh < 10) hh = "0" + hh;
            let y = x % 3600;
            let mm = Math.floor(y / 60);
            if (mm < 10) mm = "0" + mm;
            let ss = Math.round(y % 60);
            if (ss < 10) ss = "0" + ss;
            return hh + " : " + mm + " : " + ss;
        },

        showDate()
        {
          // Difference between TAI and UTC. This value should be
          // updated each time the IERS announces a leap second.
          let tai_offset = 37;

          let d = new Date();
          let millis = d.getTime();
          let jd_ut = 2440587.5 + (millis / 8.64E7);
          let jd_tt = jd_ut + (tai_offset + 32.184) / 86400;
          let j2000 = jd_tt - 2451545.0;

          let msd = (((j2000 - 4.5) / 1.027491252) + 44796.0 - 0.00096);
          let mtc = (24 * msd) % 24;

          let calculatedate = (msd-44786.0)/668.591;  //value from which we will start calculating date
          let year = calculatedate - (calculatedate%1);     //BML year
          let currentyear = (calculatedate%1)*668.591; //USed to get actual date
          let martianmonth;
          let martianDate;
          let check = false;
          // let msd = currentyear;


          if (currentyear <= 1 +28 )
          { martianmonth = "Sagittarius / January#1"; martianDate = currentyear - (currentyear%1) ;  check = true; }
          else
          {currentyear = currentyear - 28; }

          if (currentyear <= 1 +28 && check == false )
          { martianmonth = "Dhanus / January-#2"; martianDate = currentyear - (currentyear%1) ;  check = true; }
          else
          {currentyear = currentyear - 28; }

          if (currentyear <= 1 +28 && check == false )
          { martianmonth = "Capricornus / February#1"; martianDate = currentyear - (currentyear%1) ;  check = true; }
          else
          {currentyear = currentyear - 28; }

          if (currentyear <= 1 +28 && check == false )
          { martianmonth = "Makara / February#2"; martianDate = currentyear - (currentyear%1) ;  check = true; }
          else
          {currentyear = currentyear - 28; }

          if (currentyear <= 1 +28 && check == false )
          { martianmonth = "Aquarius / March#1"; martianDate = currentyear - (currentyear%1) ;  check = true; }
          else
          {currentyear = currentyear - 28; }

          if (currentyear <= 1 +27 && check == false )
          { martianmonth = "Kumbha / March#2"; martianDate = currentyear - (currentyear%1) ;  check = true; }
          else
          {currentyear = currentyear - 27; }

          if (currentyear <= 1 +28 && check == false )
          { martianmonth = "Pisces / April#1"; martianDate = currentyear - (currentyear%1) ;  check = true; }
          else
          {currentyear = currentyear - 28; }

          if (currentyear <= 1 +28 && check == false )
          { martianmonth = "Mina / April#2"; martianDate = currentyear - (currentyear%1) ;  check = true; }
          else
          {currentyear = currentyear - 28; }

          if (currentyear <= 1 +28 && check == false )
          { martianmonth = "Aries / May#1"; martianDate = currentyear - (currentyear%1) ;  check = true; }
          else
          {currentyear = currentyear - 28; }

          if (currentyear <= 1 +28 && check == false )
          { martianmonth = "Mesha / May#2"; martianDate = currentyear - (currentyear%1) ;  check = true; }
          else
          {currentyear = currentyear - 28; }

          if (currentyear <= 1 +28 && check == false )
          { martianmonth = "Taurus / June#1"; martianDate = currentyear - (currentyear%1) ;  check = true; }
          else
          {currentyear = currentyear - 28; }

          if (currentyear <= 1 +27 && check == false )
          { martianmonth = "Rishabha / June#2"; martianDate = currentyear - (currentyear%1) ;  check = true; }
          else
          {currentyear = currentyear - 27; }

          if (currentyear <= 1 +28 && check == false )
          { martianmonth = "Gemini / July#1"; martianDate = currentyear - (currentyear%1) ;  check = true; }
          else
          {currentyear = currentyear - 28; }

          if (currentyear <= 1 +28 && check == false )
          { martianmonth = "Mithuna / July#2"; martianDate = currentyear - (currentyear%1) ;  check = true; }
          else
          {currentyear = currentyear - 28; }

          if (currentyear <= 1 +28 && check == false )
          { martianmonth = "Cancer / August#1"; martianDate = currentyear - (currentyear%1) ;  check = true; }
          else
          {currentyear = currentyear - 28; }

          if (currentyear <= 1 +28 && check == false )
          { martianmonth = "Karka / August#2"; martianDate = currentyear - (currentyear%1) ;  check = true; }
          else
          {currentyear = currentyear - 28; }

          if (currentyear <= 1 +28 && check == false )
          { martianmonth = "Leo / September#1"; martianDate = currentyear - (currentyear%1) ;  check = true; }
          else
          {currentyear = currentyear - 28; }

          if (currentyear <= 1 +27 && check == false )
          { martianmonth = "Simha / September#2"; martianDate = currentyear - (currentyear%1) ;  check = true; }
          else
          {currentyear = currentyear - 27; }

          if (currentyear <= 1 +28 && check == false )
          { martianmonth = "Virgo / October#1"; martianDate = currentyear - (currentyear%1) ;  check = true; }
          else
          {currentyear = currentyear - 28; }

          if (currentyear <= 1 +28 && check == false )
          { martianmonth = "Kanya / October#2"; martianDate = currentyear - (currentyear%1) ;  check = true; }
          else
          {currentyear = currentyear - 28; }

          if (currentyear <= 1 +28 && check == false )
          { martianmonth = "Libra / November#1"; martianDate = currentyear - (currentyear%1) ;  check = true; }
          else
          {currentyear = currentyear - 28; }

          if (currentyear <= 1 +28 && check == false )
          { martianmonth = "Tula / November#2"; martianDate = currentyear - (currentyear%1) ;  check = true; }
          else
          {currentyear = currentyear - 28; }

          if (currentyear <= 1 +28 && check == false )
          { martianmonth = "Scorpius / December#1"; martianDate = currentyear - (currentyear%1) ;  check = true; }
          else
          {currentyear = currentyear - 28; }

          if (currentyear <= 1 +28 && check == false )
          { martianmonth = "Vrishika / December#2"; martianDate = currentyear - (currentyear%1) ;  check = true; }
          else
          {currentyear = currentyear - 28; }

            this.martianDate = "Martian Date : " + martianDate + " " + martianmonth + ", " + year + " BML";
            this.martianTime = "Martian Time : " + this.h_to_hms(mtc) + "  AMT [ adjusted to the standard J2000 Epoch ( 1 Jan 2000, 12:00 UTC) ]"; //assigns today string to "dateDiv" element Id in inner HTML
        }

  },

  destroyed() {
    // EventBus.$off('show-contact-modal', this.toggleContactModal());           //AUTH
  },
};
</script>


<style lang="scss" src="./style.scss" scoped>
</style>      
