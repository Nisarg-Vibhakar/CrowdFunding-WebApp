import React from "react";

import { useContext, createContext } from "react";
import { useAddress,useContract,useMetamask,useContractWrite, useContractMetadata } from "@thirdweb-dev/react";
import { ethers } from "ethers";


const StateContext = createContext();

export const StateContextProvider = ({ children }) => {

    const {contract} = useContract('0x0e46d5052AF254AC797a1746723250112311c582');


    const {mutateAsync: createCampaign} = useContractWrite(contract, 'createCampaign');
    // directly allows us to submit and use the function we deployed on the smart contract

    const address = useAddress();
    const connect = useMetamask()

    const publishCampaign = async (form) => {
        
       try {
                 const data = await createCampaign([
            
            //The order in which the values are passed in, 
            //should be the same as the order in which they are declared in the contract


            address, //owner
            form.title, //title
            form.description, //description
            form.target, //target
            new Date(form.deadline).getTime(), //deadline,
            form.image

        ])

        console.log('Contract call successful',data)
        
       } catch (error) {
           console.log('Contract call failed', error)
           

       }
    }
    //statecontext provider is a function that allows us to access the state of the app
    //it also has to return something


    const getCampaigns = async () => {
        
        const campaigns = await contract.call('getCampaigns');

        const parsedCampaigns = campaigns.map((campaign, i) => ({
        
             owner: campaign.owner,
             title: campaign.title,
             description: campaign.description,
             target: ethers.utils.formatEther(campaign.target.toString()),
             deadline: campaign.deadline.toNumber(),
             amountCollected: ethers.utils.formatEther(campaign.amountCollected.toString()),
             image: campaign.image,
             pId:i
        }))

        return parsedCampaigns
        
    }

    const getUserCampaigns = async () => {
    
        const allCampaigns = await getCampaigns()

        const filteredCampaigns = allCampaigns.filter(campaign => campaign.owner === address)

        return filteredCampaigns
        
    }

    const donate = async (pId, amount) => {
    const data = await contract.call('donateToCampaign', pId, { value: ethers.utils.parseEther(amount)});

    return data;
  }

    const getDonations = async (pId) => {
    
        const donations = await contract.call('getDonators',pId);
        const numberOfDonations = donations[0].length;

        const parsedDonations = []

        for (let i = 1; i <numberOfDonations; i++) {
            
            parsedDonations.push({
            
                donator: donations[0][i],
                donation:ethers.utils.formatEther(donations[1][i].toString())
                
            })
        }

        return parsedDonations

    }


    return (
        <StateContext.Provider
        value={{
            address,
            contract,
            connect,
            createCampaign:publishCampaign,
            getCampaigns,
            getUserCampaigns,
            donate,
            getDonations
        }}
        > 
        {children}</StateContext.Provider>
    )
}


export const useStateContext = () => useContext(StateContext);