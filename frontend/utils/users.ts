const users = process.env.NEXT_PUBLIC_SUPPORTED_UIDS

export default users?.split(",").map(item=>item.trim());