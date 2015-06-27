declare module ip {

    export function isValid(ip1: string, ip2: string): boolean;

    export function isEqual(ip1: string, ip2: string): boolean;

    export function cidr_num(ip: string, num: number): string;

    export function cidr_num_Subnet(ip: string, num: number): Subnet;

    export function toBuffer(ip: string, buffer?: number, offset?: number): NodeBuffer;

    export function toString(ip: NodeBuffer, offset?: number, length?: number): string;

    export function fromPrefixLen(prefixLength: number, family?: string): string;

    export function mask(ip: string, mask: string): string;

    export function cidr(cidr: string): string;

    export function cidrSubnet(cidr: string): Subnet;

    export function subnet(ip: string, mask: string): Subnet;

    export interface Subnet {
        networkAddress: any;
        firstAddress: any;
        lastAddress: any;
        broadcastAddress: any;
        subnetMask: any;
        subnetMaskLength: any;
        numHosts: any;
        length: any;
    }

    export function not(ip: string): string;

    export function or(ip: string, mask: string): string;

    export function isPrivate(ip: string): boolean;

    export function isPublic(ip: string): boolean;

    export function isLoopback(ip: string): boolean;

    export function loopback(family?: string): string;

    export function address(name?: string, family?: string): string;

    export function toLong(ip: string): number;

    export function fromLong(ip: number): string;

    export interface Address {
        kind(): string;
        toString(): string;
        match(range: Address, bits: number): boolean;
        range(): string;
        toByteArray(): Array<number>;
        octets: Array<number>;
        SpecialRanges: {
            broadcast;
        };
    }

    export function match(IP1, IP2, bits: number): boolean;

    export function range(str: string): string;

    export function kind(str: string): string;

    export function parse(address: string): Address;

    export function process(address: string): Address;

    interface SubnetMap { [s: string]: Array<any> }

    export function subnetMatch(address: Address, rangeList: SubnetMap,
        defaultName: string): string;

    export interface IPv6Address extends Address {
        toNormalizedString(): string;
        isIPv4MappedAddress(): boolean;
        toIPv4Address(): IPv4Address;
        parts: Array<number>;
    }

    export interface IPv4Address extends Address {
        toIPv4MappedAddress(): IPv6Address;
        octets: Array<number>;
    }

    export interface VersionSpecificIpUtils<T> {
        isValid(address: string): boolean;
        parse(address: string): T;
    }

    var IPv4: VersionSpecificIpUtils<IPv4Address>;
    var IPv6: VersionSpecificIpUtils<IPv6Address>;

}

declare function random_mac(prefix?): string;