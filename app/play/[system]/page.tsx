import {notFound} from 'next/navigation';
import DiscRoom from '../../disc-room';
import {getSystem} from '../../systems';
export default async function SystemPage({params}:{params:Promise<{system:string}>}){const {system}=await params;if(!getSystem(system))notFound();return <DiscRoom systemId={system}/>;}
