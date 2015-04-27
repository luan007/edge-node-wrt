import Node = require("Node");
import Iptables = require('../../../Common/Native/Iptables');

/*
 Filter-in ----> [system-in-filter] -----> [custom-in-filter] ----->
 */

export var Chains =  {
    System: {
        Filter: {
            Input: new Iptables.Chain('in_sys', Iptables.Iptables.Filter),
            Forward: new Iptables.Chain('fw_sys', Iptables.Iptables.Filter),
            Output: new Iptables.Chain('ot_sys', Iptables.Iptables.Filter),
        },
        NAT: {
            Prerouting: new Iptables.Chain('pre_sys', Iptables.Iptables.NAT),
            Postrouting: new Iptables.Chain('post_sys', Iptables.Iptables.NAT)
        },
        Mangle: {
            TrafficPre: new Iptables.Chain("pre_traffic", Iptables.Iptables.Mangle),
            TrafficPost: new Iptables.Chain("post_traffic", Iptables.Iptables.Mangle)
        }
    },
    Custom: {
        Filter: {
            Input: new Iptables.Chain('in_custom', Iptables.Iptables.Filter),
            Forward: new Iptables.Chain('fw_custom', Iptables.Iptables.Filter),
            Output: new Iptables.Chain('ot_custom', Iptables.Iptables.Filter),
        }
    }
};

export var Rules =  {
    DropIncomingRequests: new Iptables.Rule(),
    HttpTrafficProxy: new Iptables.Rule(),
    UplinkNAT: new Iptables.Rule()
};

export function Initialize(cb) {
    var s_account_i = new Iptables.Rule();
    s_account_i.Target = Iptables.Target_Type.CHAIN;
    s_account_i.TargetOptions = <Iptables.IChainOption>{ Chain: Chains.System.Mangle.TrafficPre.Name };

    var s_account_o = new Iptables.Rule();
    s_account_o.Target = Iptables.Target_Type.CHAIN;
    s_account_o.TargetOptions = <Iptables.IChainOption>{ Chain: Chains.System.Mangle.TrafficPost.Name };

    var s_filter_in = new Iptables.Rule();
    s_filter_in.Target = Iptables.Target_Type.CHAIN;
    s_filter_in.TargetOptions = <Iptables.IChainOption>{ Chain: Chains.System.Filter.Input.Name };

    var s_filter_fw = new Iptables.Rule();
    s_filter_fw.Target = Iptables.Target_Type.CHAIN;
    s_filter_fw.TargetOptions = <Iptables.IChainOption>{ Chain: Chains.System.Filter.Forward.Name };

    var s_filter_ot = new Iptables.Rule();
    s_filter_ot.Target = Iptables.Target_Type.CHAIN;
    s_filter_ot.TargetOptions = <Iptables.IChainOption>{ Chain: Chains.System.Filter.Output.Name };


    var c_filter_in = new Iptables.Rule();
    c_filter_in.Target = Iptables.Target_Type.CHAIN;
    c_filter_in.TargetOptions = <Iptables.IChainOption>{ Chain: Chains.Custom.Filter.Input.Name };

    var c_filter_fw = new Iptables.Rule();
    c_filter_fw.Target = Iptables.Target_Type.CHAIN;
    c_filter_fw.TargetOptions = <Iptables.IChainOption>{ Chain: Chains.Custom.Filter.Forward.Name };

    var c_filter_ot = new Iptables.Rule();
    c_filter_ot.Target = Iptables.Target_Type.CHAIN;
    c_filter_ot.TargetOptions = <Iptables.IChainOption>{ Chain: Chains.Custom.Filter.Output.Name };

    var s_nat_pre = new Iptables.Rule();
    s_nat_pre.Target = Iptables.Target_Type.CHAIN;
    s_nat_pre.TargetOptions = <Iptables.IChainOption>{ Chain: Chains.System.NAT.Prerouting.Name };

    var s_nat_post = new Iptables.Rule();
    s_nat_post.Target = Iptables.Target_Type.CHAIN;
    s_nat_post.TargetOptions = <Iptables.IChainOption>{ Chain: Chains.System.NAT.Postrouting.Name };

    Rules.DropIncomingRequests.Match_State = <Iptables.IState> {
        NEW: true
    };
    Rules.DropIncomingRequests.Target = (CONF.IS_DEBUG && !CONF.BASE_FIREWALL) ? Iptables.Target_Type.ACCEPT : Iptables.Target_Type.DROP;

    if (CONF.ENABLE_HTTPPROXY) {
        Rules.HttpTrafficProxy.Protocol = { TCP: true };
        Rules.HttpTrafficProxy.Destination_Port = { Id: 80 };
        Rules.HttpTrafficProxy.Target = Iptables.Target_Type.REDIRECT;
        Rules.HttpTrafficProxy.TargetOptions = <Iptables.IRedirectOption>{
            Port: {
                Id: 3378
            }
        };
    } else {
        Rules.HttpTrafficProxy.Target = Iptables.Target_Type.RETURN;
    }

    Rules.UplinkNAT.Target = Iptables.Target_Type.MASQUERADE;

    async.series([
        Iptables.Iptables.Mangle.AddChain.bind(null, Chains.System.Mangle.TrafficPre),
        Iptables.Iptables.Mangle.AddChain.bind(null, Chains.System.Mangle.TrafficPost),
        Iptables.Iptables.Filter.AddChain.bind(null, Chains.System.Filter.Input),
        Iptables.Iptables.Filter.AddChain.bind(null, Chains.System.Filter.Forward),
        Iptables.Iptables.Filter.AddChain.bind(null, Chains.System.Filter.Output),

        Iptables.Iptables.Filter.AddChain.bind(null, Chains.Custom.Filter.Input),
        Iptables.Iptables.Filter.AddChain.bind(null, Chains.Custom.Filter.Forward),
        Iptables.Iptables.Filter.AddChain.bind(null, Chains.Custom.Filter.Output),

        Iptables.Iptables.NAT.AddChain.bind(null, Chains.System.NAT.Prerouting),
        Iptables.Iptables.NAT.AddChain.bind(null, Chains.System.NAT.Postrouting),

        Iptables.Iptables.Filter.INPUT.Add.bind(null, s_filter_in),
        Iptables.Iptables.Filter.INPUT.Add.bind(null, c_filter_in),
        Iptables.Iptables.Filter.INPUT.Add.bind(null, Rules.DropIncomingRequests),
        Iptables.Iptables.Filter.FORWARD.Add.bind(null, s_filter_fw),
        Iptables.Iptables.Filter.FORWARD.Add.bind(null, c_filter_fw),
        Iptables.Iptables.Filter.OUTPUT.Add.bind(null, s_filter_ot),
        Iptables.Iptables.Filter.OUTPUT.Add.bind(null, c_filter_ot),
        Iptables.Iptables.Mangle.PREROUTING.Add.bind(null, s_account_i),
        Iptables.Iptables.Mangle.POSTROUTING.Add.bind(null, s_account_o),
        Iptables.Iptables.NAT.PREROUTING.Add.bind(null, Rules.HttpTrafficProxy),
        Iptables.Iptables.NAT.PREROUTING.Add.bind(null, s_nat_pre),
        Iptables.Iptables.NAT.POSTROUTING.Add.bind(null, s_nat_post),
        Iptables.Iptables.NAT.POSTROUTING.Add.bind(null, Rules.UplinkNAT)
    ], cb);
}