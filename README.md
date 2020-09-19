#ChainLink #Hackathon #ChainLinkHackathon

![Copy of SIGH FINANCE LOGO (3)](https://user-images.githubusercontent.com/53361416/93666386-72bbb300-fa9b-11ea-9222-392a63dad61d.png)

## Inspiration
I have been interested in the Blockchain space for long (you can read my articles either on my blog - cryptowhaler.github.io or on Medium - medium.com/@cryptowhaler ) but was initially more inclined towards its use-cases within the institutional financial space. However, now i am of the opinion that the emerging crypto assets market is a much better place to innovate, will grow much faster, and is most probably the only place where you can create monetary structures which can help make space exploratory missions a profitable undertaking.

## What it does
SIGH Finance is essentially a money market protocol, with certain differences & optimizations when compared to Compound / Aave, briefly listed below -

**Version - 1**

1. We are adding another token, SIGH, which is inflationary in nature (1% per day initially for 96 days, then 0.5% for a year which gets halved every year for 10 years)
2. The SIGH tokens are added to a reserve contract, which drips these tokens at a certain rate per block (can be modified)
3. The SIGH tokens are distributed among the supported markets based upon their performance (% losses / % gains, calculated daily), where the markets which have made any losses are allocated SIGH token distribution rate for the next 24 hours which can compensate for the losses made.
4. The protocol fee (% of the interest rate) and the inflationary SIGH supply is further used to buy crypto assets (WBTC/WETH/LINK/SIGH among others) from the market and add them to the treasury.
5. The funds from the treasury are used as reserves and to buyback SIGH tokens from the market at regular intervals which can then be redistributed among the loss bearing markets.
6. The treasury funds, while acting as an investment fund, should act as a cover for the decrease in SIGH token's inflation rate over the years, that is, for example, the BTC purchased during the initial years should be more than enough to balance out the value of SIGH tokens available via inflation when compensating investors against market losses in the future.
7. The governance token, GSIGH, has similar distribution mechanism as COMP of compound, and will be used for deciding upon future course of action through voting.

**Version - 2** (These additions will be made but it may be difficult to do so within the Hackathon's time-frame)

1. A.I modelling techniques to calculate the most optimum SIGH distribution rates, interest rates, treasury to reserve ratio, among others factors, on a per minute basis, which will be easily possible on Ethereum 2.0 with much lower gas fees along-with increased speed.
2. The platform will support self balancing tokenized basket of crypto assets which can be invested into, and the investor can further approve them to be used for lending purposes and earn interest from his investments. This will allow the protocol to expand the number of supported markets to a much greater scale.
Sigh Finance is essentially being designed in a manner which can bring in more institutional capital into this nascent space, addresses the current high volatility issue, and the underlying incentive mechanisms will further allow it to stay relevant in the rapidly evolving DeFi space for a much longer duration.

## How I built it
1. I took compound finance's code as the initial starting point, understood how it works, then came up with the additions that i wanted to do over it.
2. I did a preliminary analysis regarding how the functioning of SIGH tokens and the treasury vault can be optimized to ensure a long-term value creation.
3. Set up the website link using vue js , created a medium publication link and the twitter account link
4. Writing the code and testing it locally with truffle and ganache.
5. Will test it thoroughly on the test-nets and will add Graph protocol based querying facility.

Note - Will try to add tokenized baskets and AI modelling techniques within the timeframe, but if not then it will be added later.

## Challenges I ran into
Actually me along with my family got infected with Covid, so that's been a real blocker and have slowed down the progress.

## Accomplishments that I'm proud of
I knew the technical stuff regarding Ethereum / smart contracts etc, but was not much aware about the innovations happening in this space (AMMs, liquidity mining etc). This covid period gave me a chance to delve a bit deeper into it and now i am about to make a full blown career change. I inherently believe that DeFi, while being a revolution led by the underlying blockchain infrastructure, will essentially be taken forward by the innovations in quantitative modelling techniques (AMMs are a quantitative breakthrough, not a technical brakthrough, which are now being improved upon by Dodo protocol) and will contribute to the study of econometrics and related theories. 

The long-term approach around developing SIGH Finance essentially revolves around trying to create new quantitative modelling techniques by using A.I which can help the protocol perform to its most optimum, the learnings from which will help further improve the protocol and expand our offerings.

## What I learned
This is my first full blown Dapp which i am making individually, so learnt a lot around solidity coding principles, proxy contract standards, Graph protocol, implemented liquidity mining pipeline which actually has a use-case and a lot more.

## What's next for SIGH Finance
Support for tokenized basket of crypto assets, integration with AI modelling techniques (initially it will be tested thoroughly, before it goes live in the production environment), and a plan regarding how to take the SIGH Finance protocol live on chain (token sale, listing, liquidity supply etc).

## Built With
graph
solidity
vue
web3

## Try it out
[sigh.finance](sigh.finance)

[medium.com]()

[twitter.com]()
